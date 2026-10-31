<?php

namespace Tests\Feature;

use App\Models\Page;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Smoke tests for the public storefront pages.
 */
class StorefrontTest extends TestCase
{
    use RefreshDatabase;

    /** Home, shop listing, product page and a policy page all render. */
    public function test_public_pages_render(): void
    {
        [$product] = $this->makeProduct();
        Page::create(['slug' => 'shipping-policy', 'title' => 'Shipping Policy', 'content' => '<p>We ship.</p>']);

        $this->get('/')->assertOk();
        $this->get('/shop')->assertOk()->assertSee($product->name);
        $this->get('/shop/women')->assertOk();
        $this->get("/product/{$product->slug}")->assertOk()->assertSee($product->name);
        $this->get('/shipping-policy')->assertOk()->assertSee('Shipping Policy');
    }

    /** Unknown products and pages are 404s, not errors. */
    public function test_missing_pages_return_404(): void
    {
        $this->get('/product/nope')->assertNotFound();
        $this->get('/no-such-page')->assertNotFound();
    }
}
