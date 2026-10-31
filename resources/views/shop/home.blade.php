{{--
    Home page.

    Variables (ShopController@home):
      $newIn        – latest 8 active products
      $byDepartment – [department slug => best-selling products] for each
                      department in config('shop.departments')
--}}
@extends('layouts.app')

@php
    // Hero collage: [image, alt text, product slug]. The first photo spans both rows.
    $heroImages = [
        ['/images/products/long-coat-2.jpg', 'Model in a beige long coat, black tee and trousers', 'long-coat'],
        ['/images/products/gingham-crop-top-2.jpg', 'Model in a black and white gingham crop top', 'long-sleeves-crop-top'],
        ['/images/products/crop-jacket.jpg', 'Model in a check crop jacket', 'crop-jacket'],
    ];

    // Store promises shown at the bottom: [heading, sub-line].
    $promises = [
        ['Nationwide Delivery', 'Rs. 500 Karachi · Rs. 1,000 Pakistan'],
        ['Cash on Delivery', 'Or pay by bank transfer'],
        ['Easy Exchange', 'Within 14 days of delivery'],
    ];
@endphp

@section('content')
    {{-- Hero: headline + department buttons beside a three-photo collage --}}
    <section aria-labelledby="hero-heading" class="bg-cream">
        <div class="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 md:grid-cols-[5fr_7fr] md:gap-12 md:px-8 md:py-16 lg:px-10 xl:px-16 xl:py-24">
            <div class="text-center md:text-left">
                <p class="eyebrow text-ink-2">Closet Stories</p>
                <h1 id="hero-heading" class="mt-4 text-[clamp(40px,3.6vw+18px,80px)] leading-[1.02] font-normal tracking-[-0.01em]">Classy Comfort, Every Day</h1>
                <p class="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-2 md:mx-0 md:text-[17px]">Everyday fashion for the whole family — tops, shirts, denim, dresses and cosy outerwear for women, men and kids.</p>
                <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
                    <a href="{{ route('shop', 'new') }}" class="btn">Shop New In</a>
                    @foreach (config('shop.departments') as $d)
                        <a href="{{ route('shop', $d['slug']) }}" class="btn-outline">Shop {{ $d['name'] }}</a>
                    @endforeach
                </div>
            </div>
            <div class="grid grid-cols-[3fr_2fr] gap-3 md:gap-4">
                @foreach ($heroImages as [$src, $alt, $slug])
                    <a href="{{ route('product', $slug) }}" @class(['group relative block overflow-hidden bg-beige', 'row-span-2 aspect-[3/5]' => $loop->first])>
                        <img src="{{ $src }}" alt="{{ $alt }}" class="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] {{ $loop->first ? 'group-hover:scale-[1.03]' : 'object-top group-hover:scale-[1.04]' }}">
                    </a>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Shop by category: one large tile per department --}}
    <section class="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h2 class="text-center text-4xl">Shop by Category</h2>
        <div class="mt-10 grid gap-4 sm:grid-cols-3">
            @foreach (config('shop.departments') as $d)
                <a href="{{ route('shop', $d['slug']) }}" class="group relative block aspect-[3/4] overflow-hidden bg-cream">
                    <img src="{{ $d['image'] }}" alt="{{ $d['name'] }}" class="size-full object-cover transition duration-700 group-hover:scale-105">
                    <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6 font-display text-3xl text-ivory">{{ $d['name'] }}</span>
                </a>
            @endforeach
        </div>
    </section>

    {{-- New in --}}
    <section class="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div class="flex items-end justify-between">
            <h2 class="text-4xl">New In</h2>
            <a href="{{ route('shop', 'new') }}" class="font-ui text-[13px] uppercase tracking-[0.14em] underline underline-offset-4">View all</a>
        </div>
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            @foreach ($newIn as $product)
                @include('partials.product-card')
            @endforeach
        </div>
    </section>

    {{-- "Shop the Edit": one tab + product panel per department; the script below switches them --}}
    <section class="mx-auto max-w-7xl px-4 py-10 md:px-8" data-tabs>
        <h2 class="text-center text-4xl">Shop the Edit</h2>
        <div class="mt-6 flex justify-center gap-6 font-ui text-[13px] uppercase tracking-[0.14em]">
            @foreach (config('shop.departments') as $d)
                <button type="button" data-tab="{{ $d['slug'] }}" class="border-b pb-1 {{ $loop->first ? 'border-charcoal' : 'border-transparent text-ink-3' }}">{{ $d['name'] }}</button>
            @endforeach
        </div>
        @foreach ($byDepartment as $slug => $products)
            <div data-panel="{{ $slug }}" @class(['mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4', 'hidden' => ! $loop->first])>
                @foreach ($products as $product)
                    @include('partials.product-card')
                @endforeach
            </div>
        @endforeach
    </section>

    {{-- Store promises --}}
    <section class="mx-auto mt-10 grid max-w-7xl gap-6 px-4 text-center sm:grid-cols-3 md:px-8">
        @foreach ($promises as [$heading, $line])
            <div class="border border-line bg-cream px-6 py-8">
                <p class="font-ui text-[14px] font-medium uppercase tracking-[0.14em]">{{ $heading }}</p>
                <p class="mt-2 text-[14px] text-ink-2">{{ $line }}</p>
            </div>
        @endforeach
    </section>

    {{-- Tab switcher for "Shop the Edit": underline the clicked tab, show only its panel --}}
    <script>
        document.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
            document.querySelectorAll('[data-tab]').forEach((b) => b.className = 'border-b pb-1 ' + (b === btn ? 'border-charcoal' : 'border-transparent text-ink-3'));
            document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== btn.dataset.tab));
        }));
    </script>
@endsection
