<?php

namespace Tests\Feature;

use App\Mail\OrderPlaced;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Delivery quotes and order placement (Cash on Delivery and Bank Transfer).
 */
class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedShipping();
    }

    /** City-based rates: Karachi -> Rs 500, elsewhere -> Rs 1,000, no city yet -> both. */
    #[DataProvider('cities')]
    public function test_quote_matches_city(string $city, array $prices): void
    {
        $this->getJson('/checkout/quote?'.http_build_query(['country' => 'PK', 'city' => $city]))
            ->assertOk()
            ->assertJsonPath('methods.*.price', $prices);
    }

    public static function cities(): array
    {
        return [
            'karachi' => ['Karachi', [500]],
            'lahore' => ['Lahore', [1000]],
            'no city' => ['', [500, 1000]],
        ];
    }

    /**
     * Placing an order charges the right delivery, decrements stock, empties
     * the bag, emails the customer, and shows bank details only for transfers.
     */
    #[DataProvider('payments')]
    public function test_place_order(string $payment, string $city, int $delivery, bool $showsBank): void
    {
        Mail::fake();
        [, $variant] = $this->makeProduct(price: 2500, stock: 5);

        $response = $this->withSession(['cart' => [$variant->id => 2]])
            ->post('/checkout', $this->address($city) + ['payment_method' => $payment]);

        $order = Order::sole();
        $response->assertRedirect(route('checkout.confirmation', $order->access_token))
            ->assertSessionMissing('cart');

        $this->assertSame(5000, $order->subtotal);
        $this->assertSame($delivery, $order->shipping_cost);
        $this->assertSame(5000 + $delivery, $order->total);
        $this->assertSame(3, $variant->fresh()->stock_quantity);
        Mail::assertSent(OrderPlaced::class, fn ($mail) => $mail->hasTo('buyer@example.com'));

        $iban = config('shop.bank_transfer.details.IBAN');
        $page = $this->get(route('checkout.confirmation', $order->access_token))->assertOk();
        $showsBank ? $page->assertSee($iban) : $page->assertDontSee($iban);
    }

    public static function payments(): array
    {
        return [
            'cod in karachi' => ['cod', 'Karachi', 500, false],
            'bank transfer in lahore' => ['bank_transfer', 'Lahore', 1000, true],
        ];
    }

    /** A bag asking for more than is in stock is never oversold: the line is capped to the stock left. */
    public function test_order_over_stock_is_capped(): void
    {
        Mail::fake();
        [, $variant] = $this->makeProduct(stock: 1);

        $this->withSession(['cart' => [$variant->id => 3]])
            ->post('/checkout', $this->address('Karachi') + ['payment_method' => 'cod']);

        $this->assertSame(1, Order::sole()->items()->sole()->quantity);
        $this->assertSame(0, $variant->fresh()->stock_quantity);
    }

    /** When the variant sold out after going in the bag, no order is placed. */
    public function test_sold_out_bag_is_rejected(): void
    {
        Mail::fake();
        [, $variant] = $this->makeProduct(stock: 0);

        $this->withSession(['cart' => [$variant->id => 2]])
            ->post('/checkout', $this->address('Karachi') + ['payment_method' => 'cod'])
            ->assertRedirect();

        $this->assertSame(0, Order::count());
        $this->assertSame(0, $variant->fresh()->stock_quantity);
        Mail::assertNothingSent();
    }

    /** A valid Pakistani delivery address for the given city. */
    private function address(string $city): array
    {
        return [
            'email' => 'buyer@example.com', 'phone' => '+92 300 1234567',
            'first_name' => 'Ayesha', 'last_name' => 'Khan',
            'address_line_1' => '12 Main Road', 'city' => $city, 'country' => 'PK',
        ];
    }
}
