<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Mail\OrderPlaced;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Support\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Checkout: the address/payment form, live delivery quotes, placing the
 * order and the confirmation page.
 */
class CheckoutController extends Controller
{
    /** Countries we deliver to (code => name). Also read by checkout/show.blade.php. */
    public const COUNTRIES = ['PK' => 'Pakistan', 'AE' => 'United Arab Emirates', 'SA' => 'Saudi Arabia', 'QA' => 'Qatar', 'GB' => 'United Kingdom', 'US' => 'United States', 'CA' => 'Canada', 'AU' => 'Australia'];

    /** Pakistani provinces offered in the checkout dropdown. */
    public const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir'];

    /** Address fields copied onto the order as its shipping_address. */
    private const ADDRESS_FIELDS = ['first_name', 'last_name', 'phone', 'address_line_1', 'address_line_2', 'city', 'province', 'postal_code', 'country'];

    /**
     * Show the checkout form. Rates are worked out from the previously typed
     * country/city (after a validation error), so the right one stays selected.
     */
    public function show(Request $request)
    {
        $lines = Cart::lines();
        if ($lines->isEmpty()) {
            return redirect()->route('cart');
        }

        return view('checkout.show', [
            'lines' => $lines,
            'subtotal' => Cart::subtotal($lines),
            'methods' => Cart::shippingMethods(old('country', 'PK'), old('city', '')),
            'user' => $request->user(),
        ]);
    }

    /**
     * JSON delivery rates for the address being typed (polled by the checkout page).
     * With no city yet, every rate for the country is returned.
     */
    public function quote(Request $request)
    {
        $methods = Cart::shippingMethods(
            strtoupper((string) $request->query('country', 'PK')),
            $request->query('city'),
        );

        return response()->json([
            'subtotal' => Cart::subtotal(),
            'methods' => $methods->map(fn ($m) => [
                'code' => $m->code,
                'name' => $m->name,
                'description' => $m->description,
                'price' => $m->price,
                'days' => "{$m->min_days}–{$m->max_days} working days",
            ])->values(),
        ]);
    }

    /**
     * Place the order: pick the delivery rate for the city, reserve stock,
     * save the order and email the customer.
     */
    public function place(PlaceOrderRequest $request)
    {
        $data = $request->validated();

        $lines = Cart::lines();
        if ($lines->isEmpty()) {
            return redirect()->route('cart')->withErrors(['cart' => 'Your bag is empty.']);
        }

        // The rate is resolved server side from country + city; the posted code is
        // only a preference and falls back to the first rate that applies.
        $method = Cart::shippingFor($data['country'], $data['city'], $data['shipping_method'] ?? null);
        if (! $method) {
            return back()->withInput()->withErrors(['shipping_method' => 'We do not deliver to this address yet.']);
        }

        $order = DB::transaction(function () use ($data, $lines, $method, $request) {
            $this->reserveStock($lines);

            $subtotal = Cart::subtotal($lines);
            $order = Order::create([
                'order_number' => 'CS-'.now()->format('ymd').'-'.strtoupper(Str::random(4)),
                // Unguessable token for the guest-viewable confirmation URL.
                'access_token' => Str::random(48),
                'user_id' => $request->user()?->id,
                'email' => $data['email'],
                'phone' => $data['phone'],
                // COD orders can be packed right away; bank transfers wait for payment.
                'status' => $data['payment_method'] === 'cod' ? 'confirmed' : 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => $data['payment_method'],
                'shipping_method' => $method->code,
                'shipping_method_name' => $method->name,
                'subtotal' => $subtotal,
                'shipping_cost' => $method->price,
                'total' => $subtotal + $method->price,
                'shipping_address' => collect($data)->only(self::ADDRESS_FIELDS)->all(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Items keep a snapshot of name/price/image so later product edits do not change past orders.
            $order->items()->createMany($lines->map(fn ($line) => [
                'product_id' => $line->product->id,
                'variant_id' => $line->variant->id,
                'product_name' => $line->product->name,
                'product_slug' => $line->product->slug,
                'image_url' => $line->product->image,
                'variant_name' => $line->variant->name,
                'price' => $line->price,
                'quantity' => $line->quantity,
            ])->all());

            return $order;
        });

        Cart::clear();

        // A mail failure must never lose a placed order, so it is only logged.
        try {
            Mail::to($order->email)->bcc(config('shop.orders_bcc'))->send(new OrderPlaced($order));
        } catch (\Throwable $e) {
            Log::warning('Order email failed: '.$e->getMessage());
        }

        return redirect()->route('checkout.confirmation', $order->access_token);
    }

    /** Thank-you page, found by the order's secret access token. */
    public function confirmation(string $token)
    {
        return view('checkout.confirmation', [
            'order' => Order::with('items')->where('access_token', $token)->firstOrFail(),
        ]);
    }

    /**
     * Re-check and decrement stock for every bag line. Must run inside a
     * transaction: lockForUpdate stops two shoppers buying the last piece.
     * Throws a validation error (rolling everything back) if a size sold out.
     */
    private function reserveStock(Collection $lines): void
    {
        foreach ($lines as $line) {
            $variant = ProductVariant::lockForUpdate()->find($line->variant->id);

            if (! $variant || $variant->stock_quantity < $line->quantity) {
                throw ValidationException::withMessages(['cart' => "{$line->product->name} ({$line->variant->size}) just sold out."]);
            }

            $variant->decrement('stock_quantity', $line->quantity);
            $line->product->increment('sales_count', $line->quantity);
        }
    }
}
