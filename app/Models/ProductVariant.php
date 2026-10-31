<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A buyable size/colour of a product. Stock is tracked here, and the bag
 * stores variant ids. A null price means "use the product's price".
 */
class ProductVariant extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $guarded = [];

    /** The product this variant belongs to. */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
