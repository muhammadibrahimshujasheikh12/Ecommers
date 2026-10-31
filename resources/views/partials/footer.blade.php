{{--
    Site footer: brand blurb, shop + help links, contact details and the
    accepted payment methods. Included by layouts/app; reads only config('shop.*').
--}}
<footer class="mt-20 border-t border-line bg-cream">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        {{-- Brand --}}
        <div>
            <img src="/images/brand/closet-stories-logo.avif" alt="{{ config('shop.name') }}" class="h-14 w-auto">
            <p class="mt-4 text-[14px] leading-relaxed text-ink-2">{{ config('shop.description') }}</p>
        </div>

        {{-- Shop: one link per department, then the New In and Sale collections --}}
        <div>
            <p class="eyebrow mb-4">Shop</p>
            <ul class="space-y-2 text-[14px]">
                @foreach (config('shop.departments') as $d)
                    <li><a href="{{ route('shop', $d['slug']) }}">{{ $d['name'] }}</a></li>
                @endforeach
                <li><a href="{{ route('shop', 'new') }}">New In</a></li>
                <li><a href="{{ route('shop', 'sale') }}">Sale</a></li>
            </ul>
        </div>

        {{-- Help: CMS pages, keyed by Page slug --}}
        <div>
            <p class="eyebrow mb-4">Help</p>
            <ul class="space-y-2 text-[14px]">
                @foreach ([
                    'shipping-policy' => 'Shipping Policy',
                    'return-policy' => 'Returns & Exchange',
                    'faqs' => 'FAQs',
                    'privacy-policy' => 'Privacy Policy',
                    'terms-and-conditions' => 'Terms & Conditions',
                ] as $slug => $label)
                    <li><a href="{{ route('page', $slug) }}">{{ $label }}</a></li>
                @endforeach
            </ul>
        </div>

        {{-- Contact --}}
        <div>
            <p class="eyebrow mb-4">Contact</p>
            <ul class="space-y-2 text-[14px] text-ink-2">
                <li><a href="{{ config('shop.contact.phone_href') }}">{{ config('shop.contact.phone') }}</a></li>
                <li><a href="mailto:{{ config('shop.contact.email') }}">{{ config('shop.contact.email') }}</a></li>
                <li>{{ config('shop.contact.address') }}</li>
                <li>{{ config('shop.contact.hours') }}</li>
                <li><a href="{{ config('shop.instagram') }}" target="_blank" rel="noopener">Instagram</a></li>
            </ul>
        </div>
    </div>

    {{-- Bottom bar: copyright and payment-method badges (COD, Bank Transfer) --}}
    <div class="border-t border-line">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 font-ui text-[12px] text-ink-3 md:px-8">
            <p>© {{ date('Y') }} {{ config('shop.name') }}. All rights reserved.</p>
            <ul class="flex gap-2">
                @foreach (config('shop.payment_methods') as $m)
                    <li class="border border-line-strong bg-ivory px-2.5 py-1">{{ $m['label'] }}</li>
                @endforeach
            </ul>
        </div>
    </div>
</footer>
