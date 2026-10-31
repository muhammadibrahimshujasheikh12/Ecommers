{{--
    Product listing: a category, "new", "sale", search results or everything.

    Variables (ShopController@index):
      $title         – page heading when not on a category (e.g. "Sale", "Search: denim")
      $category      – current Category, or null
      $root          – top-level category whose children are the filter chips, or null
      $subcategories – $root's children (empty collection when $root is null)
      $products      – paginated products (query string kept across pages)
--}}
@extends('layouts.app', ['title' => $title])

@php
    $heading = $category?->name ?? $title;

    // Sub-category chips: "All <department>" first, then each child; the current one is filled.
    $chips = $root ? [[$root, 'All '.$root->name], ...$subcategories->map(fn ($sub) => [$sub, $sub->name])] : [];
@endphp

@section('content')
    <div class="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <x-breadcrumb :current="$heading"
            :links="$category?->parent ? [$category->parent->name => route('shop', $category->parent->slug)] : []" />

        <h1 class="mt-4 text-5xl">{{ $heading }}</h1>
        @if ($category?->description)
            <p class="mt-3 max-w-2xl text-ink-2">{{ $category->description }}</p>
        @endif

        @if ($subcategories->isNotEmpty())
            <div class="mt-6 flex flex-wrap gap-2">
                @foreach ($chips as [$chip, $label])
                    <a href="{{ route('shop', $chip->slug) }}" class="border px-4 py-2 font-ui text-[13px] {{ $category?->id === $chip->id ? 'border-charcoal bg-charcoal text-ivory' : 'border-line-strong' }}">{{ $label }}</a>
                @endforeach
            </div>
        @endif

        {{-- Filter bar: result count, size and sort. GET form that submits on change;
             the search term rides along in a hidden field so filtering keeps it. --}}
        <form class="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-3 font-ui text-[13px]">
            @if (request('q'))
                <input type="hidden" name="q" value="{{ request('q') }}">
            @endif
            <p class="text-ink-3">{{ $products->total() }} {{ Str::plural('product', $products->total()) }}</p>
            <div class="flex gap-3">
                <select name="size" onchange="this.form.submit()" class="border border-line-strong bg-white px-3 py-2">
                    <option value="">All sizes</option>
                    @foreach (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as $s)
                        <option @selected(request('size') === $s)>{{ $s }}</option>
                    @endforeach
                </select>
                <select name="sort" onchange="this.form.submit()" class="border border-line-strong bg-white px-3 py-2">
                    @foreach (['' => 'Newest', 'popular' => 'Best selling', 'price-asc' => 'Price: low to high', 'price-desc' => 'Price: high to low'] as $value => $label)
                        <option value="{{ $value }}" @selected($value !== '' && request('sort') === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
        </form>

        {{-- Results --}}
        @if ($products->isEmpty())
            <p class="py-20 text-center text-ink-2">No products found. <a href="{{ route('shop') }}" class="underline">Shop all</a></p>
        @else
            <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
                @foreach ($products as $product)
                    @include('partials.product-card')
                @endforeach
            </div>
            <div class="mt-12">{{ $products->links() }}</div>
        @endif
    </div>
@endsection
