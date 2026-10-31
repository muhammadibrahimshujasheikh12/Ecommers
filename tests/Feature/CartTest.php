<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The session bag: [variant_id => qty], capped by stock.
 */
class CartTest extends TestCase
{
    use RefreshDatabase;

    /** Add, change quantity, then remove (quantity 0) a bag line. */
    public function test_add_update_and_remove(): void
    {
        [$product, $variant] = $this->makeProduct(stock: 5);

        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 2])
            ->assertRedirect(route('cart'))
            ->assertSessionHas('cart', [$variant->id => 2]);
        $this->get('/cart')->assertOk()->assertSee($product->name);

        $this->patch("/cart/{$variant->id}", ['quantity' => 4])
            ->assertSessionHas('cart', [$variant->id => 4]);

        $this->patch("/cart/{$variant->id}", ['quantity' => 0])
            ->assertSessionHas('cart', []);
    }

    /** Adding beyond stock is capped; adding when the bag already holds all stock is refused. */
    public function test_add_is_capped_by_stock(): void
    {
        [, $variant] = $this->makeProduct(stock: 2);

        $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 9])
            ->assertSessionHas('cart', [$variant->id => 2]);

        $this->post('/cart', ['variant_id' => $variant->id])
            ->assertSessionHasErrors('variant_id');
    }
}
