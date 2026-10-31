{{--
    Shopping bag page.

    Variables (CartController@index):
      $lines    – Cart lines: each has ->product, ->variant, ->price, ->quantity, ->total
      $subtotal – sum of line totals, in rupees
    Delivery is not charged here; it is worked out from the city at checkout.
--}}
@extends('layouts.app', ['title' => 'Your Bag'])

@section('content')
    <div class="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h1 class="text-5xl">Your Bag</h1>
        @error('cart') <p class="error mt-4">{{ $message }}</p> @enderror

        @if ($lines->isEmpty())
            <div class="py-20 text-center">
                <p class="text-ink-2">Your bag is empty.</p>
                <a href="{{ route('shop') }}" class="btn mt-6">Continue shopping</a>
            </div>
        @else
            <div class="mt-10 grid gap-10 md:grid-cols-[1fr_360px]">
                {{-- Bag lines --}}
                <ul class="divide-y divide-line border-y border-line">
                    @foreach ($lines as $line)
                        <li class="flex gap-4 py-5">
                            <a href="{{ route('product', $line->product->slug) }}" class="w-24 shrink-0 bg-cream">
                                <img src="{{ $line->product->image }}" alt="" class="aspect-[3/4] w-full object-cover">
                            </a>
                            <div class="flex flex-1 flex-col">
                                <a href="{{ route('product', $line->product->slug) }}" class="text-[15px]">{{ $line->product->name }}</a>
                                <p class="mt-1 text-[13px] text-ink-3">{{ $line->variant->name }}</p>
                                <p class="mt-1 font-ui text-[14px]">{{ rs($line->price) }}</p>

                                {{-- Quantity controls: each button PATCHes the new quantity (0 removes the line).
                                     "+" is disabled at the variant's stock level; the server re-checks anyway. --}}
                                <div class="mt-auto flex items-center gap-4 pt-3">
                                    <form method="POST" action="{{ route('cart.update', $line->variant->id) }}" class="flex items-center border border-line-strong">
                                        @csrf @method('PATCH')
                                        <button name="quantity" value="{{ $line->quantity - 1 }}" class="px-3 py-1" aria-label="Decrease">−</button>
                                        <span class="w-8 text-center font-ui text-[14px]">{{ $line->quantity }}</span>
                                        <button name="quantity" value="{{ $line->quantity + 1 }}" class="px-3 py-1" aria-label="Increase" @disabled($line->quantity >= $line->variant->stock_quantity)>+</button>
                                    </form>
                                    <form method="POST" action="{{ route('cart.update', $line->variant->id) }}">
                                        @csrf @method('PATCH')
                                        <button name="quantity" value="0" class="text-[13px] text-ink-3 underline">Remove</button>
                                    </form>
                                </div>
                            </div>
                            <p class="font-ui text-[15px]">{{ rs($line->total) }}</p>
                        </li>
                    @endforeach
                </ul>

                {{-- Summary --}}
                <aside class="h-fit bg-cream p-6">
                    <div class="mb-5 text-[13px] text-ink-2">Delivery: <strong>Rs. 500</strong> in Karachi · <strong>Rs. 1,000</strong> outside Karachi</div>
                    <dl class="space-y-2 font-ui text-[14px]">
                        <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ rs($subtotal) }}</dd></div>
                        <div class="flex justify-between text-ink-3"><dt>Delivery</dt><dd>At checkout</dd></div>
                    </dl>
                    <a href="{{ route('checkout') }}" class="btn mt-6 w-full">Checkout</a>
                    <p class="mt-3 text-center font-ui text-[12px] text-ink-3">Cash on delivery &amp; bank transfer available</p>
                </aside>
            </div>
        @endif
    </div>
@endsection
