<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A shop category. Categories form a tree (e.g. Women > Tops) through
 * parent_id; the top level is the departments listed in config/shop.php.
 */
class Category extends Model
{
    use HasUuids;

    protected $guarded = [];

    /** The category this one sits under, or null for a top-level department. */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /** Direct sub-categories, in menu order. */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('position');
    }

    /** Products filed directly in this category (not in its sub-categories). */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * IDs of this category and all of its descendants, so a department page
     * can list products from every sub-category with one whereIn().
     *
     * Breadth-first walk: $ids grows while we iterate it, so each newly found
     * child is itself visited. The tree is small, so one query per node is fine.
     */
    public function treeIds(): array
    {
        $ids = [$this->id];
        for ($i = 0; $i < count($ids); $i++) {
            array_push($ids, ...Category::where('parent_id', $ids[$i])->pluck('id'));
        }

        return $ids;
    }
}
