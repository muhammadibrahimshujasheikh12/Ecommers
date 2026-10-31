<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * All shop tables. Money columns are whole rupees (unsigned integers).
 * Catalogue tables use UUIDs carried over from the previous Next.js site.
 */
return new class extends Migration
{
    /** Create the shop tables and add phone/is_admin to users. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable();
            $table->boolean('is_admin')->default(false);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('parent_id')->nullable()->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('category_id')->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('short_description')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('price');
            $table->unsignedInteger('compare_at_price')->nullable();
            $table->string('sku')->unique();
            $table->boolean('featured')->default(false);
            $table->boolean('active')->default(true);
            $table->string('material')->nullable();
            $table->string('care_instructions')->nullable();
            $table->json('details')->nullable();
            $table->unsignedInteger('sales_count')->default(0);
            $table->timestamps();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->uuid('product_id')->index();
            $table->string('url');
            $table->string('alt_text')->nullable();
            $table->integer('position')->default(0);
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id')->index();
            $table->string('name');
            $table->string('sku');
            $table->string('size')->nullable();
            $table->string('color')->nullable();
            $table->string('color_hex', 9)->nullable();
            $table->unsignedInteger('price')->nullable(); // null = use the product price
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->integer('position')->default(0);
        });

        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('description')->nullable();
            $table->unsignedInteger('price');
            $table->unsignedInteger('min_days');
            $table->unsignedInteger('max_days');
            // Matching rules used by Cart::shippingMethods(); null = no restriction.
            $table->json('countries')->nullable();
            $table->json('cities')->nullable();
            $table->json('exclude_cities')->nullable();
            $table->integer('position')->default(0);
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->string('slug')->primary();
            $table->string('title');
            $table->string('summary')->nullable();
            $table->longText('content');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('access_token', 64)->unique(); // lets guests open their order page
            $table->foreignId('user_id')->nullable()->index();
            $table->string('email');
            $table->string('phone');
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid');
            $table->string('payment_method');
            $table->string('shipping_method');
            $table->string('shipping_method_name');
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('shipping_cost');
            $table->unsignedInteger('total');
            $table->json('shipping_address');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Order lines snapshot name/price so later catalogue edits don't alter old orders.
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->index();
            $table->uuid('product_id')->nullable();
            $table->uuid('variant_id')->nullable();
            $table->string('product_name');
            $table->string('product_slug');
            $table->string('image_url')->nullable();
            $table->string('variant_name');
            $table->unsignedInteger('price');
            $table->unsignedInteger('quantity');
        });
    }

    /** Drop the shop tables (children first) and the extra user columns. */
    public function down(): void
    {
        foreach (['order_items', 'orders', 'pages', 'shipping_methods', 'product_variants', 'product_images', 'products', 'categories'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['phone', 'is_admin']));
    }
};
