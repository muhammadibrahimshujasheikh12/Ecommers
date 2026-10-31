<?php

namespace Tests;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * Base test case with small helpers that build shop data straight from the
 * models (the app ships only a UserFactory). Tests run on the in-memory
 * SQLite database configured in phpunit.xml, never on the real catalogue.
 */
abstract class TestCase extends BaseTestCase
{
    /**
     * Create an active product in a fresh "women" category with one size variant.
     *
     * @return array{0: Product, 1: ProductVariant}
     */
    protected function makeProduct(int $price = 2500, int $stock = 5): array
    {
        $category = Category::create(['name' => 'Women', 'slug' => 'women']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Linen Shirt',
            'slug' => 'linen-shirt',
            'sku' => 'CS-TEST01',
            'price' => $price,
            'active' => true,
        ]);

        $variant = $product->variants()->create([
            'name' => 'Default / M',
            'sku' => 'CS-TEST01-M',
            'size' => 'M',
            'stock_quantity' => $stock,
        ]);

        return [$product, $variant];
    }

    /**
     * Seed the two Pakistani delivery rates the business uses: Rs 500 for
     * Karachi (matched via `cities`) and Rs 1,000 everywhere else (Karachi
     * excluded via `exclude_cities`).
     */
    protected function seedShipping(): void
    {
        ShippingMethod::create([
            'code' => 'karachi', 'name' => 'Karachi Delivery', 'price' => 500,
            'min_days' => 1, 'max_days' => 3, 'countries' => ['PK'],
            'cities' => ['karachi'], 'position' => 0,
        ]);
        ShippingMethod::create([
            'code' => 'pakistan', 'name' => 'Nationwide Delivery', 'price' => 1000,
            'min_days' => 3, 'max_days' => 5, 'countries' => ['PK'],
            'exclude_cities' => ['karachi'], 'position' => 1,
        ]);
    }
}
