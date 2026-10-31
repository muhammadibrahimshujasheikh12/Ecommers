{{--
    Product detail page: gallery, size picker / add to bag, delivery rates,
    info accordion and related products.

    Variables (ShopController@product):
      $product – Product with images, variants and category.parent loaded
      $related – up to 4 other products from the same category
--}}
@extends('layouts.app', ['title' => $product->name, 'description' => $product->short_description])

@php
    $variants = $product->variants;
    // Every variant of a product shares one colour, so the first one describes it.
    $colour = $variants->first();
    // Pakistani delivery rates, listed for information only — the actual rate is chosen from the city at checkout.
    $rates = \App\Models\ShippingMethod::orderBy('position')->get()->filter(fn ($m) => in_array('PK', $m->countries ?? []));

    $category = $product->category;
    $crumbs = array_filter([
        $category?->parent?->name => $category?->parent ? route('shop', $category->parent->slug) : null,
        $category?->name => $category ? route('shop', $category->slug) : null,
    ]);
@endphp

@section('content')
    <div class="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <x-breadcrumb :links="$crumbs" :current="$product->name" />

        <div class="mt-6 grid gap-10 md:grid-cols-[1.2fr_1fr]">
            {{-- Gallery: thumbnails (only when there is more than one photo) swap the main image via app.js --}}
            <div class="flex flex-col-reverse gap-3 md:flex-row">
                @if ($product->images->count() > 1)
                    <div class="flex gap-3 md:flex-col">
                        @foreach ($product->images as $img)
                            <button type="button" data-thumb="{{ $img->url }}" class="w-20 shrink-0 overflow-hidden border border-line">
                                <img src="{{ $img->url }}" alt="" class="aspect-[3/4] w-full object-cover">
                            </button>
                        @endforeach
                    </div>
                @endif
                <div class="flex-1 overflow-hidden bg-cream">
                    @if ($product->image)
                        <img data-main-image src="{{ $product->image }}" alt="{{ $product->name }}" class="w-full object-cover">
                    @endif
                </div>
            </div>

            {{-- Purchase panel --}}
            <div>
                <p class="eyebrow">{{ $product->brand ?? $category?->name }}</p>
                <h1 class="mt-2 text-4xl leading-tight md:text-5xl">{{ $product->name }}</h1>
                <x-price :product="$product" class="mt-4 font-ui text-xl" strike="text-base text-ink-3" />
                <p class="mt-1 text-[13px] text-ink-3">Inclusive of all taxes. Delivery calculated at checkout.</p>
                @if ($product->short_description)
                    <p class="mt-5 text-ink-2">{{ $product->short_description }}</p>
                @endif

                {{-- Add to bag: posts one variant_id. Sold-out sizes are disabled;
                     a single in-stock size is pre-selected. --}}
                <form method="POST" action="{{ route('cart.add') }}" class="mt-6">
                    @csrf
                    @if ($colour?->color)
                        <p class="label">Colour: <span class="font-normal text-ink-2">{{ $colour->color }}</span></p>
                        <span class="mb-5 inline-block size-8 rounded-full border border-line-strong" style="background: {{ $colour->color_hex ?? '#ddd' }}"></span>
                    @endif

                    <p class="label">Size</p>
                    <div class="flex flex-wrap gap-2">
                        @foreach ($variants as $v)
                            <label class="cursor-pointer">
                                <input type="radio" name="variant_id" value="{{ $v->id }}" class="peer sr-only" @disabled($v->stock_quantity < 1) @checked($variants->count() === 1 && $v->stock_quantity > 0)>
                                <span class="grid min-h-11 min-w-12 place-items-center border border-line-strong px-3 font-ui text-[13px] peer-checked:border-charcoal peer-checked:bg-charcoal peer-checked:text-ivory peer-disabled:cursor-not-allowed peer-disabled:text-ink-3 peer-disabled:line-through">{{ $v->size ?? 'One Size' }}</span>
                            </label>
                        @endforeach
                    </div>
                    @error('variant_id') <p class="error">{{ $message }}</p> @enderror

                    <p class="mt-5 font-ui text-[13px] {{ $product->in_stock ? 'text-success' : 'text-sale' }}">● {{ $product->in_stock ? 'In stock, ready to ship' : 'Sold out' }}</p>
                    <button class="btn mt-5 w-full" @disabled(! $product->in_stock)>Add to Bag</button>
                </form>

                {{-- Delivery & payment summary --}}
                <div class="mt-8 space-y-3 border-t border-line pt-6 text-[14px] text-ink-2">
                    <p class="font-ui font-medium text-charcoal">Delivery options</p>
                    @foreach ($rates as $r)
                        <p class="flex justify-between gap-4"><span><span class="text-charcoal">{{ $r->name }}</span> · {{ $r->min_days }}–{{ $r->max_days }} working days</span><span>{{ rs($r->price) }}</span></p>
                    @endforeach
                    <p class="text-[13px] text-ink-3">Pay by cash on delivery or bank transfer.</p>
                    <p>Easy exchange within 14 days of delivery.</p>
                </div>

                {{-- Info accordion; optional sections only appear when the product has that data --}}
                <div class="mt-6 border-t border-line">
                    <x-accordion title="Description" open>
                        {{-- Blank lines in the description separate paragraphs --}}
                        <div class="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-2">
                            @foreach (preg_split('/\n{2,}/', (string) $product->description) as $para)
                                <p>{{ $para }}</p>
                            @endforeach
                        </div>
                    </x-accordion>
                    @if ($product->details)
                        <x-accordion title="Product Details">
                            <dl class="mt-3 grid grid-cols-[130px_1fr] gap-2 text-[14px]">
                                @foreach ($product->details as $d)
                                    <dt class="text-ink-3">{{ $d['label'] }}</dt><dd>{{ $d['value'] }}</dd>
                                @endforeach
                                <dt class="text-ink-3">SKU</dt><dd>{{ $product->sku }}</dd>
                            </dl>
                        </x-accordion>
                    @endif
                    @if ($product->material)
                        <x-accordion title="Material">
                            <p class="mt-3 text-[15px] text-ink-2">{{ $product->material }}</p>
                        </x-accordion>
                    @endif
                    @if ($product->care_instructions)
                        <x-accordion title="Care Instructions">
                            <p class="mt-3 text-[15px] text-ink-2">{{ $product->care_instructions }}</p>
                        </x-accordion>
                    @endif
                    <x-accordion title="Shipping & Returns">
                        <p class="mt-3 text-[15px] text-ink-2">Orders are processed within 1–2 working days. Exchanges within 14 days of delivery for unworn items with tags attached. <a href="{{ route('page', 'shipping-policy') }}" class="underline">Shipping policy</a> · <a href="{{ route('page', 'return-policy') }}" class="underline">Return policy</a></p>
                    </x-accordion>
                </div>
            </div>
        </div>

        {{-- Related products --}}
        @if ($related->isNotEmpty())
            <section class="mt-20">
                <h2 class="text-3xl">You may also like</h2>
                <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
                    @foreach ($related as $item)
                        @include('partials.product-card', ['product' => $item])
                    @endforeach
                </div>
            </section>
        @endif
    </div>
@endsection
