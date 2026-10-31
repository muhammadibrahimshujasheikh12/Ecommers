<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A delivery rate, keyed by code. Which rate applies is decided by
 * Cart::shippingMethods() from these lists:
 *  - countries:      ISO codes it serves (null = everywhere);
 *  - cities:         lower-case city names it is limited to (null = any city);
 *  - exclude_cities: cities it never applies to (e.g. "Pakistan" rate excludes Karachi).
 */
class ShippingMethod extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = 'code';

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = ['countries' => 'array', 'cities' => 'array', 'exclude_cities' => 'array'];
}
