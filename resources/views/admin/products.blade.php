{{--
    Admin > Products: searchable catalogue list with per-size stock.
    Variables: $products (paginator of Product with category, variants).
--}}
@extends('layouts.admin', ['title' => 'Products'])

@section('content')
    <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-4xl">Products</h1>
        <a href="{{ route('admin.products.create') }}" class="btn">+ Add product</a>
    </div>
    <form class="mt-6 flex gap-3">
        <input name="q" value="{{ request('q') }}" placeholder="Search name or SKU" class="field max-w-xs">
        <button class="btn">Search</button>
    </form>

    <div class="mt-4 overflow-x-auto border border-line bg-ivory">
        <table class="w-full text-[14px]">
            <thead class="bg-cream text-left font-ui text-[12px] uppercase tracking-[0.1em] text-ink-3">
                <tr><th class="p-3">Product</th><th class="p-3">Category</th><th class="p-3">Sizes / stock</th><th class="p-3 text-right">Price</th><th class="p-3">Status</th></tr>
            </thead>
            <tbody>
                @foreach ($products as $p)
                    <tr class="border-t border-line hover:bg-cream">
                        <td class="p-3">
                            <a href="{{ route('admin.products.edit', $p) }}" class="flex items-center gap-3">
                                <img src="{{ $p->image }}" alt="" class="aspect-[3/4] w-10 object-cover">
                                <span><span class="font-medium underline">{{ $p->name }}</span><br><span class="text-ink-3">{{ $p->brand }} · {{ $p->sku }}</span></span>
                            </a>
                        </td>
                        <td class="p-3">{{ $p->category?->name }}</td>
                        <td class="p-3">
                            @foreach ($p->variants as $v)
                                {{-- 2 or fewer left is flagged as low stock --}}
                                <span class="mr-1 inline-block border px-1.5 {{ $v->stock_quantity <= 2 ? 'border-sale text-sale' : 'border-line-strong' }}">{{ $v->size }}: {{ $v->stock_quantity }}</span>
                            @endforeach
                        </td>
                        <td class="p-3 text-right whitespace-nowrap">{{ rs($p->price) }}</td>
                        <td class="p-3">{{ $p->active ? 'Live' : 'Hidden' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    <div class="mt-6">{{ $products->links() }}</div>
@endsection
