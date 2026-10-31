<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use Illuminate\Http\Request;

/**
 * Public storefront: home page, product listings, product detail and policy pages.
 * Only active products are ever shown.
 */
class ShopController extends Controller
{
    /** Relations every product card needs (photo, sizes/stock). */
    private const CARD = ['images', 'variants'];

    /** Home page: latest arrivals plus best sellers for each department in config/shop.php. */
    public function home()
    {
        return view('shop.home', [
            'newIn' => Product::with(self::CARD)->where('active', true)->latest()->take(8)->get(),
            'byDepartment' => collect(config('shop.departments'))->mapWithKeys(function ($d) {
                $category = Category::where('slug', $d['slug'])->first();

                return [$d['slug'] => $category
                    ? Product::with(self::CARD)->where('active', true)
                        ->whereIn('category_id', $category->treeIds()) // department + its sub-categories
                        ->orderByDesc('sales_count')->latest()->take(8)->get()
                    : collect()];
            }),
        ]);
    }

    /**
     * Product listing. {slug} is "new" (last 30 days), "sale" (has a higher
     * compare-at price), a category slug, or empty for everything. Supports
     * ?q= search, ?size= (in-stock only) and ?sort=.
     */
    public function index(Request $request, ?string $slug = null)
    {
        $query = Product::with([...self::CARD, 'category'])->where('active', true);
        $category = null;

        $title = match ($slug) {
            null, '' => 'Shop All',
            'new' => 'New In',
            'sale' => 'Sale',
            default => null,
        };

        if ($slug === 'new') {
            $query->where('created_at', '>=', now()->subDays(30));
        } elseif ($slug === 'sale') {
            $query->whereNotNull('compare_at_price')->whereColumn('compare_at_price', '>', 'price');
        } elseif ($title === null) {
            $category = Category::where('slug', $slug)->firstOrFail();
            $title = $category->parent ? $category->parent->name.' · '.$category->name : $category->name;
            $query->whereIn('category_id', $category->treeIds());
        }

        if ($q = trim((string) $request->query('q'))) {
            $title = 'Search: '.$q;
            $query->where(fn ($w) => $w->where('name', 'like', "%$q%")
                ->orWhere('description', 'like', "%$q%")
                ->orWhere('details', 'like', "%$q%"));
        }

        if ($size = $request->query('size')) {
            $query->whereHas('variants', fn ($v) => $v->where('size', $size)->where('stock_quantity', '>', 0));
        }

        match ($request->query('sort')) {
            'price-asc' => $query->orderBy('price'),
            'price-desc' => $query->orderByDesc('price'),
            'popular' => $query->orderByDesc('sales_count'),
            default => $query->latest(),
        };

        // Top-level category whose children are shown as sub-category links.
        $root = $category ? ($category->parent ?? $category) : null;

        return view('shop.index', [
            'title' => $title,
            'category' => $category,
            'subcategories' => $root?->children ?? collect(),
            'root' => $root,
            'products' => $query->paginate(24)->withQueryString(),
        ]);
    }

    /** Product detail page with four random items from the same category. */
    public function product(string $slug)
    {
        $product = Product::with([...self::CARD, 'category.parent'])
            ->where('slug', $slug)->where('active', true)->firstOrFail();

        return view('shop.product', [
            'product' => $product,
            'related' => Product::with(self::CARD)->where('active', true)
                ->where('category_id', $product->category_id)
                ->whereKeyNot($product->id)
                ->inRandomOrder()->take(4)->get(),
        ]);
    }

    /** Static policy page (shipping, returns, FAQs, contact) by slug. */
    public function page(string $slug)
    {
        return view('shop.page', ['page' => Page::findOrFail($slug)]);
    }
}
