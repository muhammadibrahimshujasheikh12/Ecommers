<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A placed order. Prices, product names and the delivery address are copied
 * onto the order (and its items) so later catalogue edits never change it.
 * Guests can view their order through the random access_token.
 */
class Order extends Model
{
    /** Fulfilment steps an admin can move an order through. */
    public const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    protected $guarded = [];

    protected $casts = ['shipping_address' => 'array'];

    /** The bag lines bought in this order. */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** The customer account, or null for a guest checkout. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Human label for payment_method ("cod" or "bank_transfer"), via $order->payment_label. */
    public function getPaymentLabelAttribute(): string
    {
        return config("shop.payment_methods.{$this->payment_method}.label", 'Cash on Delivery');
    }
}
