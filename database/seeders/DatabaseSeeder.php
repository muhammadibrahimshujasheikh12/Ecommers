<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Imports the catalogue (database/data/catalog.json, exported from the
 * previous Next.js site) and creates the admin account.
 */
class DatabaseSeeder extends Seeder
{
    /** Seed the shop. Safe to re-run: it never overwrites an existing catalogue. */
    public function run(): void
    {
        // Import the catalogue only into an empty shop, so re-running the seeder
        // (e.g. to change the admin password) never resets stock or admin edits.
        if (Product::query()->doesntExist()) {
            $this->importCatalogue();
        }

        // Admin account: only created when ADMIN_PASSWORD is set in .env.
        if ($password = config('shop.admin_password')) {
            User::updateOrCreate(
                ['email' => config('shop.admin_email')],
                ['name' => 'Closet Stories Admin', 'password' => $password, 'is_admin' => true],
            );
        }
    }

    /**
     * Load every table from catalog.json in one transaction, so a bad file
     * leaves the database untouched. Only whitelisted columns are copied.
     */
    private function importCatalogue(): void
    {
        $data = json_decode(file_get_contents(database_path('data/catalog.json')), true);

        DB::transaction(function () use ($data) {
            foreach ($data['categories'] as $c) {
                Category::updateOrCreate(['id' => $c['id']], collect($c)->only(['parent_id', 'name', 'slug', 'description', 'image_url', 'position'])->all());
            }

            foreach ($data['products'] as $p) {
                // Keep the old site's "newest first" order by back-dating created_at.
                $created = now()->subDays((int) ($p['created_days_ago'] ?? 0));
                Product::updateOrCreate(['id' => $p['id']], collect($p)->only([
                    'category_id', 'name', 'slug', 'short_description', 'description', 'price', 'compare_at_price',
                    'sku', 'featured', 'material', 'care_instructions', 'details', 'sales_count',
                ])->all() + ['created_at' => $created, 'updated_at' => $created]);
            }

            // Images have auto-increment ids, so replace them instead of upserting.
            ProductImage::query()->delete();
            foreach ($data['product_images'] as $i) {
                ProductImage::create(collect($i)->only(['product_id', 'url', 'alt_text', 'position'])->all());
            }

            foreach ($data['product_variants'] as $v) {
                ProductVariant::updateOrCreate(['id' => $v['id']], collect($v)->except('id')->all());
            }

            foreach ($data['shipping_methods'] as $m) {
                ShippingMethod::updateOrCreate(['code' => $m['code']], collect($m)->only([
                    'name', 'description', 'price', 'min_days', 'max_days', 'countries', 'cities', 'exclude_cities', 'position',
                ])->all());
            }

            foreach ($data['pages'] as $pg) {
                Page::updateOrCreate(['slug' => $pg['slug']], collect($pg)->only(['title', 'summary', 'content'])->all());
            }
        });
    }
}
