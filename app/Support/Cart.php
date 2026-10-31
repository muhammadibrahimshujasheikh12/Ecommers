<?php

namespace App\Support;

use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use Illuminate\Support\Collection;

/**
 * The shopping bag, kept in the session as [variant_id => quantity], plus the
 * delivery-rate lookup used by the bag and checkout.
 *
 * The session only holds ids and quantities; prices and stock are always read
 * fresh from the database, so a tampered or stale bag can never set a price.
 * Final stock is re-checked when the order is placed (see CheckoutController).
 */
class Cart
{
    /** The raw bag: [variant_id => quantity]. */
    public static function raw(): array
    {
        return session('cart', []);
    }

    /** Add $qty of a variant to whatever is already in the bag. */
    public static function add(string $variantId, int $qty = 1): void
    {
        $cart = self::raw();
        $cart[$variantId] = ($cart[$variantId] ?? 0) + $qty;
        session(['cart' => $cart]);
    }

    /** Set a variant's quantity exactly; zero or less removes the line. */
    public static function set(string $variantId, int $qty): void
    {
        $cart = self::raw();
        if ($qty > 0) {
            $cart[$variantId] = $qty;
        } else {
            unset($cart[$variantId]);
        }
        session(['cart' => $cart]);
    }

    /** Empty the bag (after an order is placed). */
    public static function clear(): void
    {
        session()->forget('cart');
    }

    /** Total number of pieces in the bag, for the header badge. */
    public static function count(): int
    {
        return array_sum(self::raw());
    }

    /**
     * Bag lines as objects {variant, product, quantity, price, total}.
     *
     * Lines whose product was removed or deactivated are dropped, and each
     * quantity is capped at the stock left, so lines that sold out vanish.
     */
    public static function lines(): Collection
    {
        $raw = self::raw();
        if (! $raw) {
            return collect();
        }

        return ProductVariant::with('product.images')
            ->whereIn('id', array_keys($raw))
            ->get()
            ->filter(fn ($v) => $v->product?->active)
            ->map(function ($v) use ($raw) {
                $qty = min($raw[$v->id], max(0, $v->stock_quantity));
                $price = $v->price ?? $v->product->price; // variant price overrides product price

                return (object) [
                    'variant' => $v,
                    'product' => $v->product,
                    'quantity' => $qty,
                    'price' => $price,
                    'total' => $price * $qty,
                ];
            })
            ->filter(fn ($l) => $l->quantity > 0)
            ->values();
    }

    /** Sum of line totals; pass already-loaded lines to avoid a second query. */
    public static function subtotal(?Collection $lines = null): int
    {
        return ($lines ?? self::lines())->sum('total');
    }

    /**
     * Delivery rates for a destination, in display order.
     *
     * Until a city is typed every rate for the country is listed, so the bag
     * can show "Rs 500 Karachi / Rs 1,000 elsewhere". Once a city is known,
     * only rates whose `cities` list matches it (or that have no list) and
     * whose `exclude_cities` list does not match it remain. Matching is a
     * case-insensitive substring test, so "Karachi, Sindh" still counts as Karachi.
     */
    public static function shippingMethods(string $country = 'PK', ?string $city = null): Collection
    {
        $city = strtolower(trim((string) $city));
        $matches = fn (?array $list) => collect($list)->contains(fn ($c) => str_contains($city, $c));

        return ShippingMethod::orderBy('position')->get()
            ->filter(fn ($m) => $m->countries === null || in_array($country, $m->countries))
            ->filter(fn ($m) => $city === '' || ((! $m->cities || $matches($m->cities)) && ! $matches($m->exclude_cities)))
            ->values();
    }

    /**
     * The rate to charge: the chosen $code if it still applies to this
     * destination, otherwise the first rate that does (e.g. the customer
     * picked Karachi delivery, then typed Lahore).
     */
    public static function shippingFor(string $country, ?string $city, ?string $code): ?ShippingMethod
    {
        $methods = self::shippingMethods($country, $city);

        return $methods->firstWhere('code', $code) ?? $methods->first();
    }
}
