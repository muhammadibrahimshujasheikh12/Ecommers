{{--
    Product tile used in every product grid (home, listing, related items).

    Variables: $product – Product model (uses the image, in_stock and brand accessors)
--}}
@php($onSale = $product->compare_at_price && $product->compare_at_price > $product->price)

<a href="{{ route('product', $product->slug) }}" class="group block">
    {{-- Photo with a "Sold out" or "Sale" badge (sold out wins) --}}
    <div class="relative aspect-[3/4] overflow-hidden bg-cream">
        @if ($product->image)
            <img src="{{ $product->image }}" alt="{{ $product->name }}" loading="lazy" class="size-full object-cover transition duration-700 group-hover:scale-105">
        @endif
        @if (! $product->in_stock)
            <span class="absolute top-3 left-3 bg-ivory px-2 py-1 font-ui text-[11px] uppercase tracking-[0.14em]">Sold out</span>
        @elseif ($onSale)
            <span class="absolute top-3 left-3 bg-sale px-2 py-1 font-ui text-[11px] uppercase tracking-[0.14em] text-ivory">Sale</span>
        @endif
    </div>

    <div class="mt-3">
        @if ($product->brand)
            <p class="eyebrow text-[11px]">{{ $product->brand }}</p>
        @endif
        <p class="mt-1 text-[15px] leading-snug">{{ $product->name }}</p>
        <x-price :product="$product" class="mt-1 font-ui text-[14px]" />
    </div>
</a>
