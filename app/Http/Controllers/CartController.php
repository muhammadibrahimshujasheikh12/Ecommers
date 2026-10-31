<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use App\Support\Cart;
use Illuminate\Http\Request;

/**
 * The shopping bag. Contents live in the session as [variant_id => qty]
 * via the Cart helper; stock is only reserved when the order is placed.
 */
class CartController extends Controller
{
    /** Show the bag with its lines and subtotal. */
    public function index()
    {
        $lines = Cart::lines();

        return view('shop.cart', ['lines' => $lines, 'subtotal' => Cart::subtotal($lines)]);
    }

    /**
     * Add a size (variant) to the bag, never exceeding the stock available
     * once what is already in the bag is counted.
     */
    public function add(Request $request)
    {
        $data = $request->validate([
            'variant_id' => ['required', 'string'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
        ], ['variant_id.required' => 'Please choose a size.']);

        $variant = ProductVariant::findOrFail($data['variant_id']);
        $left = $variant->stock_quantity - (Cart::raw()[$variant->id] ?? 0);

        if ($left <= 0) {
            return back()->withErrors(['variant_id' => 'Sorry, no more stock in this size.']);
        }

        Cart::add($variant->id, min($data['quantity'] ?? 1, $left));

        return redirect()->route('cart')->with('status', 'Added to your bag.');
    }

    /** Change a line's quantity; 0 removes it (handled by Cart::set). */
    public function update(Request $request, string $variant)
    {
        Cart::set($variant, $request->integer('quantity'));

        return redirect()->route('cart');
    }
}
