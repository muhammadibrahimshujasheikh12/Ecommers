{{--
    Site header: search, logo, account + bag icons and the main navigation.
    Included by layouts/app on every storefront page.

    Builds its own data (nothing is passed in):
      $departments – top-level categories with their children, for the nav and dropdowns
      $bagCount    – number of items in the session bag (Cart::count())
      $accountUrl  – admins go to the dashboard, customers to their account, guests to sign in
--}}
@php
    $departments = \App\Models\Category::with('children')->whereNull('parent_id')->orderBy('position')->get();
    $bagCount = \App\Support\Cart::count();
    $accountUrl = match (true) {
        auth()->guest() => route('login'),
        auth()->user()->is_admin => route('admin.dashboard'),
        default => route('account'),
    };
@endphp
{{-- Top announcement bar — hidden for now. Remove this comment wrapper to show it again.
<div class="bg-blush font-ui text-[12px] tracking-[0.06em]">
    <div class="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <a href="{{ config('shop.contact.phone_href') }}" class="hidden md:block">Customer care: {{ config('shop.contact.phone') }}</a>
        <div class="flex flex-1 items-center justify-center gap-4">
            <button type="button" data-rotate-prev aria-label="Previous message" class="px-2 text-[16px] leading-none">‹</button>
            <p data-rotate class="min-w-0 text-center" data-items='@json(config('shop.announcements'))'>{{ config('shop.announcements')[0] }}</p>
            <button type="button" data-rotate-next aria-label="Next message" class="px-2 text-[16px] leading-none">›</button>
        </div>
        <span class="hidden md:block">Pakistan · PKR Rs.</span>
    </div>
</div>
--}}

<header class="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
    {{-- Top row: [menu toggle + search] [logo] [account + bag] --}}
    <div class="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 py-3 md:px-8">
        <div class="flex items-center gap-4">
            <button type="button" class="md:hidden" data-menu-toggle aria-label="Open menu">
                <svg class="size-6" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
            <form action="{{ route('shop') }}" class="hidden items-center gap-2 md:flex">
                <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input name="q" value="{{ request('q') }}" placeholder="SEARCH" class="w-40 bg-transparent font-ui text-[12px] tracking-[0.14em] outline-none placeholder:text-charcoal">
            </form>
        </div>

        <a href="{{ route('home') }}" aria-label="{{ config('shop.name') }} — home">
            <img src="/images/brand/closet-stories-logo.avif" alt="{{ config('shop.name') }}" class="h-12 w-auto md:h-14">
        </a>

        <div class="flex items-center justify-end gap-4">
            <a href="{{ $accountUrl }}" aria-label="Account">
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
            </a>
            <a href="{{ route('cart') }}" class="relative" aria-label="Bag ({{ $bagCount }})">
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
                @if ($bagCount)
                    <span class="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-charcoal text-[10px] text-ivory">{{ $bagCount }}</span>
                @endif
            </a>
        </div>
    </div>

    {{-- Main nav: a horizontal bar on desktop, a drop-down list on mobile (toggled by app.js via data-menu) --}}
    <nav data-menu class="hidden border-t border-line md:block md:border-0">
        <ul class="mx-auto flex max-w-7xl flex-col gap-1 px-4 pb-4 font-ui text-[13px] font-medium uppercase tracking-[0.14em] md:flex-row md:justify-center md:gap-8 md:pb-3">
            <li><a href="{{ route('home') }}" class="block py-2">Home</a></li>
            <li><a href="{{ route('shop', 'new') }}" class="block py-2">New In</a></li>
            @foreach ($departments as $dept)
                <li class="group relative">
                    <a href="{{ route('shop', $dept->slug) }}" class="block py-2">{{ $dept->name }}</a>
                    {{-- Sub-category dropdown, opened on hover (CSS only) --}}
                    @if ($dept->children->isNotEmpty())
                        <div class="left-1/2 z-50 hidden min-w-56 border border-line bg-ivory p-4 shadow-lg group-hover:block md:absolute md:-translate-x-1/2">
                            @foreach ($dept->children as $child)
                                <a href="{{ route('shop', $child->slug) }}" class="block py-1.5 font-sans text-[14px] normal-case tracking-normal text-ink-2 hover:text-charcoal">{{ $child->name }}</a>
                            @endforeach
                        </div>
                    @endif
                </li>
            @endforeach
            <li><a href="{{ route('shop', 'sale') }}" class="block py-2 text-sale">Sale</a></li>
        </ul>

        {{-- Mobile-only search box (the desktop one sits in the top row) --}}
        <form action="{{ route('shop') }}" class="px-4 pb-4 md:hidden">
            <input name="q" placeholder="Search" class="field">
        </form>
    </nav>
</header>
