{{--
    Checkout: contact, shipping address, delivery method, payment and order summary.

    Variables (CheckoutController@show):
      $lines    – bag lines (->product, ->variant, ->quantity, ->total)
      $subtotal – bag subtotal in rupees
      $methods  – shipping methods for the old() country/city. Until a city is typed every
                  rate for the country is listed; app.js re-fetches them from checkout.quote
                  as the city/country changes (Rs 500 Karachi, Rs 1,000 rest of Pakistan).
      $user     – signed-in User or null (guest checkout), used to pre-fill fields

    The data-* hooks on the form (data-checkout, data-subtotal, data-quote-url,
    data-shipping-list, data-ship-name, data-ship-cost, data-total, data-bank-details,
    data-payment-option) are read by resources/js/app.js — keep them.
--}}
@extends('layouts.app', ['title' => 'Checkout'])

@php
    // Pre-select the previously chosen rate, else the first one offered.
    $chosen = old('shipping_method', $methods->first()?->code);
@endphp

@section('content')
    <form method="POST" action="{{ route('checkout.place') }}" data-checkout data-subtotal="{{ $subtotal }}" data-quote-url="{{ route('checkout.quote') }}"
          class="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_380px] md:px-8">
        @csrf
        <div class="space-y-10">
            <h1 class="text-5xl">Checkout</h1>
            @error('cart') <p class="error">{{ $message }}</p> @enderror

            {{-- Contact --}}
            <section>
                <h2 class="text-2xl">Contact information</h2>
                @guest
                    <p class="mt-2 text-[14px] text-ink-2">Have an account? <a href="{{ route('login') }}" class="underline">Sign in</a> for faster checkout, or continue as a guest.</p>
                @endguest
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                    <x-field name="email" label="Email *" type="email" required :value="old('email', $user?->email)" autocomplete="email" />
                    <x-field name="phone" label="Phone *" type="tel" required placeholder="+92 300 1234567" :value="old('phone', $user?->phone)" autocomplete="tel" />
                </div>
            </section>

            {{-- Shipping address (the city drives the delivery rate) --}}
            <section>
                <h2 class="text-2xl">Shipping address</h2>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                    {{-- A signed-in user's name is split at the first space into first / last --}}
                    <x-field name="first_name" label="First name *" required :value="old('first_name', Str::before($user?->name, ' '))" autocomplete="given-name" />
                    <x-field name="last_name" label="Last name *" required :value="old('last_name', Str::after($user?->name, ' '))" autocomplete="family-name" />
                    <x-field name="address_line_1" label="Address *" wrap="sm:col-span-2" required placeholder="House no., street, area" :value="old('address_line_1')" autocomplete="address-line1" />
                    <x-field name="address_line_2" label="Apartment, block, landmark (optional)" wrap="sm:col-span-2" :value="old('address_line_2')" autocomplete="address-line2" />
                    <x-field name="city" label="City *" required :value="old('city')" autocomplete="address-level2" />
                    <div>
                        <label class="label" for="province">Province</label>
                        <select id="province" name="province" class="field">
                            <option value="">Select province</option>
                            @foreach (\App\Http\Controllers\CheckoutController::PROVINCES as $p)
                                <option @selected(old('province') === $p)>{{ $p }}</option>
                            @endforeach
                        </select>
                    </div>
                    <x-field name="postal_code" label="Postal code (optional)" :value="old('postal_code')" autocomplete="postal-code" />
                    <div>
                        <label class="label" for="country">Country *</label>
                        <select id="country" name="country" class="field">
                            @foreach (\App\Http\Controllers\CheckoutController::COUNTRIES as $code => $name)
                                <option value="{{ $code }}" @selected(old('country', 'PK') === $code)>{{ $name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
            </section>

            {{-- Delivery method. app.js replaces this list after each city/country change and,
                 if the chosen rate no longer applies, falls back to the first one. Keep the
                 label markup in step with the template in app.js. --}}
            <section>
                <h2 class="text-2xl">Delivery method</h2>
                <p class="mt-2 text-[13px] text-ink-3">Rs. 500 in Karachi, Rs. 1,000 elsewhere in Pakistan. The right rate is picked from your city.</p>
                <div data-shipping-list class="mt-5 space-y-3">
                    @foreach ($methods as $m)
                        <label class="flex cursor-pointer items-start gap-4 border p-4 {{ $m->code === $chosen ? 'border-charcoal bg-cream' : 'border-line-strong' }}">
                            <input type="radio" name="shipping_method" value="{{ $m->code }}" data-price="{{ $m->price }}" data-name="{{ $m->name }}" @checked($m->code === $chosen) class="mt-1 accent-charcoal">
                            <span class="flex-1">
                                <span class="block font-ui text-[15px] font-medium">{{ $m->name }}</span>
                                <span class="block text-[13px] text-ink-2">{{ $m->min_days }}–{{ $m->max_days }} working days · {{ $m->description }}</span>
                            </span>
                            <span class="font-ui text-[14px]">{{ rs($m->price) }}</span>
                        </label>
                    @endforeach
                </div>
                @error('shipping_method') <p class="error">{{ $message }}</p> @enderror
            </section>

            {{-- Payment: Cash on Delivery (default) or Bank Transfer. The bank details
                 box is revealed by app.js only while Bank Transfer is selected. --}}
            <section>
                <h2 class="text-2xl">Payment</h2>
                <div class="mt-5 space-y-3">
                    @foreach (config('shop.payment_methods') as $code => $pm)
                        <label data-payment-option class="flex cursor-pointer gap-4 border border-line-strong p-4">
                            <input type="radio" name="payment_method" value="{{ $code }}" @checked(old('payment_method', 'cod') === $code) class="mt-1 accent-charcoal">
                            <span>
                                <span class="block font-ui text-[15px] font-medium">{{ $pm['label'] }}</span>
                                <span class="block text-[13px] text-ink-2">{{ $pm['description'] }}</span>
                            </span>
                        </label>
                    @endforeach
                    <div data-bank-details class="hidden">
                        @include('partials.bank-details')
                    </div>
                </div>
                @error('payment_method') <p class="error">{{ $message }}</p> @enderror
            </section>

            <section>
                <label class="label" for="notes">Order notes (optional)</label>
                <textarea id="notes" name="notes" rows="3" class="field" placeholder="Delivery instructions, gift message…">{{ old('notes') }}</textarea>
            </section>
        </div>

        {{-- Order summary. Shipping name/cost and the total are filled in by app.js
             from the selected rate; the server recalculates everything on submit. --}}
        <aside class="h-fit bg-cream p-6 md:sticky md:top-32">
            <h2 class="text-2xl">Order summary</h2>
            <ul class="mt-5 space-y-4">
                @foreach ($lines as $line)
                    <x-line-item :image="$line->product->image" :name="$line->product->name" :detail="$line->variant->name"
                                 :amount="$line->total" :badge="$line->quantity" />
                @endforeach
            </ul>
            <dl class="mt-6 space-y-2 border-t border-line pt-4 font-ui text-[14px]">
                <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ rs($subtotal) }}</dd></div>
                <div class="flex justify-between"><dt>Shipping <span data-ship-name class="block text-[12px] text-ink-3"></span></dt><dd data-ship-cost></dd></div>
                <div class="flex justify-between border-t border-line pt-3 text-[16px] font-medium"><dt>Total</dt><dd data-total>{{ rs($subtotal) }}</dd></div>
            </dl>
            <button class="btn mt-6 w-full">Place order</button>
            <p class="mt-3 text-center text-[12px] text-ink-3">Prices in PKR, inclusive of applicable taxes.</p>
        </aside>
    </form>
@endsection
