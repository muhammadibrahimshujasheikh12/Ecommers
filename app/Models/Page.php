<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A static content page (About, Returns, ...), keyed by its URL slug.
 */
class Page extends Model
{
    public $incrementing = false;

    protected $primaryKey = 'slug';

    protected $keyType = 'string';

    protected $guarded = [];
}
