<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A product photo; the one with the lowest position is the main image.
 */
class ProductImage extends Model
{
    public $timestamps = false;

    protected $guarded = [];
}
