<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One line of an order: a snapshot of the product, variant, unit price and
 * quantity at the time of purchase (product/variant ids may later be deleted).
 */
class OrderItem extends Model
{
    public $timestamps = false;

    protected $guarded = [];
}
