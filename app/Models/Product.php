<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A catalogue product. Sizes/colours and stock live on its variants; photos
 * on its images. Inactive products are hidden from the shop and the bag.
 */
class Product extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = ['details' => 'array', 'featured' => 'boolean', 'active' => 'boolean'];

    /** The category the product is filed under. */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** Photos, main image first. */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    /** Buyable sizes/colours, in display order. */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('position');
    }

    /** $product->image: URL of the main photo, or null. Eager-load images to avoid N+1. */
    public function getImageAttribute(): ?string
    {
        return $this->images->first()?->url;
    }

    /** $product->in_stock: true while any variant has stock left. */
    public function getInStockAttribute(): bool
    {
        return $this->variants->sum('stock_quantity') > 0;
    }

    /** $product->brand: the "Brand" entry of the details list ([{label, value}, ...]), if any. */
    public function getBrandAttribute(): ?string
    {
        return collect($this->details)->firstWhere('label', 'Brand')['value'] ?? null;
    }
}
