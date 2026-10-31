{{--
    Order confirmation ("thank you") page, reached by the order's secret
    access_token (also linked from the order email and the customer's account).

    Variables (CheckoutController@confirmation):
      $order – Order with items; shipping_address is an array
               (first_name, last_name, address_line_1/2, city, province, …)
--}}
@extends('layouts.app', ['title' => 'Order confirmed'])

@php($address = $order->shipping_address)

@section('content')
    <div class="mx-auto max-w-3xl px-4 py-14 md:px-8">
        <p class="eyebrow">Order {{ $order->order_number }}</p>
        <h1 class="mt-3 text-5xl">Thank you, {{ $address['first_name'] }}!</h1>
        <p class="mt-4 text-ink-2">We've received your order and sent a confirmation to <strong>{{ $order->email }}</strong>. We'll call you on {{ $order->phone }} if we need anything.</p>

        {{-- What to do next: bank transfer orders get the account details and
             must quote the order number; COD orders just pay the courier. --}}
        @if ($order->payment_method === 'bank_transfer')
            <section class="mt-8">
                <h2 class="text-2xl">Complete your payment</h2>
                <p class="mt-2 mb-4 text-[14px] text-ink-2">Please transfer <strong>{{ rs($order->total) }}</strong> using <strong>{{ $order->order_number }}</strong> as the reference.</p>
                @include('partials.bank-details')
            </section>
        @else
            <p class="mt-8 border border-line bg-cream p-4 text-[14px]">Please keep <strong>{{ rs($order->total) }}</strong> ready for the courier.</p>
        @endif

        {{-- Items and totals (from the prices saved on the order, not the live catalogue) --}}
        <section class="mt-10 bg-cream p-6">
            <ul class="space-y-4">
                @foreach ($order->items as $item)
                    <x-line-item :image="$item->image_url" :name="$item->product_name"
                                 :detail="$item->variant_name.' × '.$item->quantity" :amount="$item->price * $item->quantity" />
                @endforeach
            </ul>
            <dl class="mt-6 space-y-2 border-t border-line pt-4 font-ui text-[14px]">
                <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ rs($order->subtotal) }}</dd></div>
                <div class="flex justify-between"><dt>{{ $order->shipping_method_name }}</dt><dd>{{ rs($order->shipping_cost) }}</dd></div>
                <div class="flex justify-between border-t border-line pt-3 text-[16px] font-medium"><dt>Total</dt><dd>{{ rs($order->total) }}</dd></div>
            </dl>
        </section>

        {{-- Delivery address and payment method --}}
        <div class="mt-8 grid gap-6 text-[14px] sm:grid-cols-2">
            <div>
                <p class="eyebrow mb-2">Delivering to</p>
                <p>
                    {{ $address['first_name'] }} {{ $address['last_name'] }}<br>
                    {{ $address['address_line_1'] }}<br>
                    @if ($address['address_line_2'] ?? null)
                        {{ $address['address_line_2'] }}<br>
                    @endif
                    {{ $address['city'] }}{{ ($address['province'] ?? null) ? ', '.$address['province'] : '' }}
                </p>
            </div>
            <div>
                <p class="eyebrow mb-2">Payment</p>
                <p>{{ $order->payment_label }}</p>
            </div>
        </div>

        <a href="{{ route('shop') }}" class="btn mt-10">Continue shopping</a>
    </div>
@endsection
