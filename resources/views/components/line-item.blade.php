{{--
    One row of an order summary: thumbnail, name, variant line and amount.
    Shared by the checkout summary (bag lines) and the confirmation page
    (saved order items).

    Props:
      image  – thumbnail URL
      name   – product name
      detail – small grey line under the name (variant, "× qty", …)
      amount – line total in rupees (formatted with rs())
      badge  – optional quantity bubble over the thumbnail (checkout only)
--}}
@props(['image', 'name', 'detail', 'amount', 'badge' => null])

<li class="flex gap-3">
    @if ($badge)
        <div class="relative w-16 shrink-0">
            <img src="{{ $image }}" alt="" class="aspect-[3/4] w-full object-cover">
            <span class="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-charcoal text-[11px] text-ivory">{{ $badge }}</span>
        </div>
    @else
        <img src="{{ $image }}" alt="" class="aspect-[3/4] w-16 object-cover">
    @endif
    <div class="flex-1 text-[14px]">
        <p>{{ $name }}</p>
        <p class="text-[12px] text-ink-3">{{ $detail }}</p>
    </div>
    <p class="font-ui text-[14px]">{{ rs($amount) }}</p>
</li>
