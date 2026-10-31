{{--
    Admin > Product create/edit form (one view for both; $product->exists decides).
    Variables: $product (Product, new or with variants/images), $categories (id => label).
    Each size row becomes a variant; all variants share one colour.
--}}
@extends('layouts.admin', ['title' => $product->exists ? $product->name : 'Add product'])

@php
    // Size rows: old input after a failed save, else existing variants; padded to 6 blank rows.
    $sizes = old('sizes', $product->exists ? $product->variants->map(fn ($v) => ['size' => $v->size, 'stock' => $v->stock_quantity])->all() : []);
    $sizes = array_pad($sizes, 6, ['size' => '', 'stock' => '']);
    // Colour is stored per variant but edited once, so read it from the first.
    $first = $product->variants?->first();
@endphp

@section('content')
    <a href="{{ route('admin.products') }}" class="font-ui text-[13px] text-ink-3">← Products</a>
    <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-4xl">{{ $product->exists ? $product->name : 'Add product' }}</h1>
        @if ($product->exists)
            <a href="{{ route('product', $product->slug) }}" target="_blank" class="btn-outline">View on shop ↗</a>
        @endif
    </div>

    <form method="POST" enctype="multipart/form-data" action="{{ $product->exists ? route('admin.products.update', $product) : route('admin.products.store') }}" class="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        @csrf
        @if ($product->exists) @method('PUT') @endif

        {{-- Main details --}}
        <div class="space-y-5 border border-line bg-ivory p-5">
            <div><label class="label">Name *</label><input name="name" required class="field" value="{{ old('name', $product->name) }}"></div>
            <div class="grid gap-4 sm:grid-cols-2">
                <div><label class="label">Brand</label><input name="brand" class="field" value="{{ old('brand', $product->brand) }}"></div>
                <div>
                    <label class="label">Category *</label>
                    <select name="category_id" required class="field">
                        @foreach ($categories as $id => $label)
                            <option value="{{ $id }}" @selected(old('category_id', $product->category_id) === $id)>{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div><label class="label">Price (Rs.) *</label><input name="price" type="number" min="0" required class="field" value="{{ old('price', $product->price) }}"></div>
                <div><label class="label">Was price (for sale)</label><input name="compare_at_price" type="number" min="0" class="field" value="{{ old('compare_at_price', $product->compare_at_price) }}"></div>
            </div>
            <div><label class="label">Short description</label><input name="short_description" class="field" value="{{ old('short_description', $product->short_description) }}"></div>
            <div><label class="label">Description</label><textarea name="description" rows="5" class="field">{{ old('description', $product->description) }}</textarea></div>
            <div class="grid gap-4 sm:grid-cols-2">
                <div><label class="label">Material</label><input name="material" class="field" value="{{ old('material', $product->material) }}"></div>
                <div><label class="label">Care</label><input name="care_instructions" class="field" value="{{ old('care_instructions', $product->care_instructions) }}"></div>
            </div>
        </div>

        <div class="space-y-6">
            {{-- Colour, sizes/stock and visibility. Hidden "0" inputs make unticked boxes submit false. --}}
            <div class="space-y-4 border border-line bg-ivory p-5">
                <div class="grid grid-cols-[1fr_80px] gap-3">
                    <div><label class="label">Colour</label><input name="color" class="field" value="{{ old('color', $first?->color) }}"></div>
                    <div><label class="label">Swatch</label><input name="color_hex" type="color" class="h-12 w-full border border-line-strong" value="{{ old('color_hex', $first?->color_hex ?? '#cccccc') }}"></div>
                </div>
                <div>
                    <p class="label">Sizes &amp; stock</p>
                    <div class="space-y-2">
                        @foreach ($sizes as $i => $s)
                            <div class="grid grid-cols-2 gap-2">
                                <input name="sizes[{{ $i }}][size]" placeholder="Size e.g. M" class="field py-2" value="{{ $s['size'] }}">
                                <input name="sizes[{{ $i }}][stock]" type="number" min="0" placeholder="Stock" class="field py-2" value="{{ $s['stock'] }}">
                            </div>
                        @endforeach
                    </div>
                    <p class="mt-1 text-[12px] text-ink-3">Leave a size blank to remove it.</p>
                </div>
                <label class="flex items-center gap-2 text-[14px]"><input type="hidden" name="active" value="0"><input type="checkbox" name="active" value="1" class="accent-charcoal" @checked(old('active', $product->active ?? true))> Live on the shop</label>
                <label class="flex items-center gap-2 text-[14px]"><input type="hidden" name="featured" value="0"><input type="checkbox" name="featured" value="1" class="accent-charcoal" @checked(old('featured', $product->featured))> Featured</label>
            </div>

            {{-- Photos: tick to remove existing, upload to add --}}
            <div class="space-y-3 border border-line bg-ivory p-5">
                <p class="label">Photos</p>
                @if ($product->exists && $product->images->isNotEmpty())
                    <div class="grid grid-cols-3 gap-2">
                        @foreach ($product->images as $img)
                            <label class="block text-[12px]">
                                <img src="{{ $img->url }}" alt="" class="aspect-[3/4] w-full object-cover">
                                <span class="mt-1 flex items-center gap-1"><input type="checkbox" name="remove_images[]" value="{{ $img->id }}"> Remove</span>
                            </label>
                        @endforeach
                    </div>
                @endif
                <input type="file" name="photos[]" accept="image/*" multiple class="block w-full text-[13px]">
            </div>

            <button class="btn w-full">{{ $product->exists ? 'Save product' : 'Add product' }}</button>
        </div>
    </form>

    {{-- Separate form: deleting must not be nested in the save form --}}
    @if ($product->exists)
        <form method="POST" action="{{ route('admin.products.destroy', $product) }}" onsubmit="return confirm('Delete this product?')" class="mt-8">
            @csrf @method('DELETE')
            <button class="text-[14px] text-sale underline">Delete product</button>
        </form>
    @endif
@endsection
