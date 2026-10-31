<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveProductRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Shop back office: dashboard, orders, products (with photo upload) and customers.
 * Every route is behind the auth + EnsureAdmin middleware (see routes/web.php).
 */
class AdminController extends Controller
{
    /** Dashboard with headline numbers and the latest orders. */
    public function dashboard()
    {
        // Cancelled orders are excluded from revenue and from "awaiting payment".
        $live = fn () => Order::where('status', '!=', 'cancelled');

        return view('admin.dashboard', [
            'stats' => [
                'Orders today' => Order::whereDate('created_at', today())->count(),
                'Revenue (30 days)' => rs($live()->where('created_at', '>=', now()->subDays(30))->sum('total')),
                'Awaiting payment' => $live()->where('payment_status', 'unpaid')->count(),
                'Products' => Product::count(),
                'Low stock variants' => ProductVariant::where('stock_quantity', '<=', 2)->count(),
                'Customers' => User::where('is_admin', false)->count(),
            ],
            'recent' => Order::latest()->take(8)->get(),
        ]);
    }

    // ----------------------------------------------------------------- Orders

    /** Order list, filterable by ?status= and searchable by number, email or phone (?q=). */
    public function orders(Request $request)
    {
        $orders = Order::latest()
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('order_number', 'like', "%$s%")
                ->orWhere('email', 'like', "%$s%")
                ->orWhere('phone', 'like', "%$s%")))
            ->paginate(30)->withQueryString();

        return view('admin.orders', ['orders' => $orders]);
    }

    /** One order with its items. */
    public function order(Order $order)
    {
        return view('admin.order', ['order' => $order->load('items')]);
    }

    /** Change an order's fulfilment and payment status (e.g. mark a bank transfer paid). */
    public function updateOrder(Request $request, Order $order)
    {
        $order->update($request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
            'payment_status' => ['required', Rule::in(['unpaid', 'paid', 'refunded'])],
        ]));

        return back()->with('status', 'Order updated.');
    }

    // --------------------------------------------------------------- Products

    /** Product list, searchable by name or SKU (?q=). */
    public function products(Request $request)
    {
        $products = Product::with(['images', 'variants', 'category'])
            ->when($request->query('q'), fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%$s%")
                ->orWhere('sku', 'like', "%$s%")))
            ->latest()->paginate(40)->withQueryString();

        return view('admin.products', ['products' => $products]);
    }

    /** Blank product form (new products default to active). */
    public function createProduct()
    {
        return view('admin.product-form', ['product' => new Product(['active' => true]), 'categories' => $this->categoryOptions()]);
    }

    /** Edit form for an existing product. */
    public function editProduct(Product $product)
    {
        return view('admin.product-form', ['product' => $product->load(['images', 'variants']), 'categories' => $this->categoryOptions()]);
    }

    /** Create a product, then continue on its edit page. */
    public function storeProduct(SaveProductRequest $request)
    {
        $product = $this->saveProduct($request, new Product);

        return redirect()->route('admin.products.edit', $product)->with('status', 'Product added.');
    }

    /** Save changes to a product. */
    public function updateProduct(SaveProductRequest $request, Product $product)
    {
        $this->saveProduct($request, $product);

        return back()->with('status', 'Product saved.');
    }

    /** Delete a product with its sizes and photos. */
    public function destroyProduct(Product $product)
    {
        $this->deleteImages($product->images);
        $product->variants()->delete();
        $product->delete();

        return redirect()->route('admin.products')->with('status', 'Product deleted.');
    }

    /**
     * Shared create/update logic: product fields, brand detail, sizes and photos.
     */
    private function saveProduct(SaveProductRequest $request, Product $product): Product
    {
        $data = $request->validated();

        // Brand is stored as the first "Brand" entry of the details list (read by the brand accessor).
        $details = collect($product->details ?? [])->reject(fn ($d) => $d['label'] === 'Brand')->values();
        if (filled($data['brand'] ?? null)) {
            $details->prepend(['label' => 'Brand', 'value' => $data['brand']]);
        }

        $product->fill([
            ...collect($data)->only(['name', 'category_id', 'price'])->all(),
            'compare_at_price' => $data['compare_at_price'] ?? null,
            'short_description' => $data['short_description'] ?? null,
            'description' => $data['description'] ?? null,
            'material' => $data['material'] ?? null,
            'care_instructions' => $data['care_instructions'] ?? null,
            'details' => $details->all(),
            'featured' => $request->boolean('featured'),
            'active' => $request->boolean('active'),
        ]);

        // Slug and SKU are fixed at creation so URLs and order references stay stable.
        if (! $product->exists) {
            $product->slug = $this->uniqueSlug($data['name']);
            $product->sku = 'CS-'.strtoupper(Str::random(6));
        }
        $product->save();

        $this->syncSizes($product, $data);
        $this->syncPhotos($request, $product);

        return $product;
    }

    /**
     * One variant per size row (matched by size so stock edits keep the same id);
     * blank rows and sizes no longer listed are removed.
     */
    private function syncSizes(Product $product, array $data): void
    {
        $color = ($data['color'] ?? null) ?: 'Default';
        $keep = [];

        foreach (array_values($data['sizes']) as $i => $row) {
            if (blank($row['size'] ?? null)) {
                continue;
            }

            $variant = $product->variants()->firstOrNew(['size' => $row['size']]);
            $variant->fill([
                'name' => "$color / {$row['size']}",
                'sku' => $product->sku.'-'.Str::upper(Str::slug($row['size'])),
                'color' => $color,
                'color_hex' => ($data['color_hex'] ?? null) ?: null,
                'stock_quantity' => (int) ($row['stock'] ?? 0),
                'position' => $i,
            ])->save();
            $keep[] = $variant->id;
        }

        $product->variants()->whereNotIn('id', $keep)->delete();
    }

    /** Store uploaded photos after the existing ones, and drop any ticked for removal. */
    private function syncPhotos(Request $request, Product $product): void
    {
        $position = (int) $product->images()->max('position') + 1;

        foreach ($request->file('photos', []) as $file) {
            // Random suffix avoids clashes between uploads for the same product.
            $name = $product->slug.'-'.Str::lower(Str::random(5)).'.'.$file->extension();
            $file->move(public_path('images/products'), $name);
            $product->images()->create(['url' => "/images/products/$name", 'alt_text' => $product->name, 'position' => $position++]);
        }

        if ($remove = $request->input('remove_images')) {
            $this->deleteImages($product->images()->whereIn('id', (array) $remove)->get());
        }
    }

    /**
     * Delete image rows and their files in public/images/products. A file is kept
     * while any other image row still points at it (imported photos can be shared).
     */
    private function deleteImages(iterable $images): void
    {
        foreach ($images as $img) {
            $img->delete();
            if (ProductImage::where('url', $img->url)->doesntExist()) {
                @unlink(public_path(ltrim($img->url, '/')));
            }
        }
    }

    /** Slug from the name, with -2, -3 … appended until it is unique. */
    private function uniqueSlug(string $name): string
    {
        $base = $slug = Str::slug($name);
        for ($i = 2; Product::where('slug', $slug)->exists(); $i++) {
            $slug = "$base-$i";
        }

        return $slug;
    }

    /**
     * Sub-categories for the product form dropdown, as [id => "Parent › Child"],
     * ordered by parent then child position. Products only go in sub-categories.
     */
    private function categoryOptions(): Collection
    {
        return Category::with('parent')->whereNotNull('parent_id')->get()
            ->sortBy(fn ($c) => [$c->parent->position, $c->position])
            ->mapWithKeys(fn ($c) => [$c->id => $c->parent->name.' › '.$c->name]);
    }

    // -------------------------------------------------------------- Customers

    /** Customer list (non-admin users) with their order counts. */
    public function customers()
    {
        return view('admin.customers', [
            'customers' => User::where('is_admin', false)->withCount('orders')->latest()->paginate(40),
        ]);
    }
}
