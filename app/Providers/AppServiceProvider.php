<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Application service provider. The shop needs no custom bindings or boot
 * logic yet; it is kept as the standard place to add them.
 */
class AppServiceProvider extends ServiceProvider
{
    /** Register container bindings. */
    public function register(): void
    {
        //
    }

    /** Run code once all providers are registered. */
    public function boot(): void
    {
        //
    }
}
