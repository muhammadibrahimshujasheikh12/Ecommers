<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The /admin area is limited to users with is_admin set.
 */
class AdminTest extends TestCase
{
    use RefreshDatabase;

    /** Guests and ordinary customers are sent to the login page. */
    public function test_non_admins_are_kept_out(): void
    {
        $this->get('/admin')->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get('/admin')->assertRedirect(route('login'));
    }

    /** An admin can open the dashboard and create a product with sizes. */
    public function test_admin_can_create_product(): void
    {
        // is_admin is not mass-assignable on purpose, so set it directly.
        $admin = tap(User::factory()->create()->forceFill(['is_admin' => true]))->save();
        $category = Category::create(['name' => 'Men', 'slug' => 'men']);

        $this->actingAs($admin)->get('/admin')->assertOk();

        // No photos uploaded here: saving them would write into public/.
        $this->actingAs($admin)->post('/admin/products', [
            'name' => 'Cotton Kurta',
            'category_id' => $category->id,
            'brand' => 'Closet Stories',
            'price' => 3500,
            'color' => 'White',
            'color_hex' => '', // the admin form always posts this field (see report: omitting it 500s)
            'sizes' => [['size' => 'S', 'stock' => 3], ['size' => 'M', 'stock' => 0], ['size' => '', 'stock' => 9]],
            'active' => 1,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $product = Product::where('slug', 'cotton-kurta')->firstOrFail();
        $this->assertSame('Closet Stories', $product->brand);
        $this->assertEqualsCanonicalizing(['S', 'M'], $product->variants->pluck('size')->all());
    }
}
