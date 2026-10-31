{{--
    Bank account details for the "bank_transfer" payment method, plus the
    note asking customers to send the receipt on WhatsApp.
    Reads config('shop.bank_transfer'); shown at checkout (when Bank Transfer
    is selected) and on the order confirmation page.
--}}
<div class="border border-line-strong bg-cream p-4 font-ui text-[14px]">
    <dl class="grid grid-cols-[130px_1fr] gap-x-4 gap-y-1.5">
        @foreach (config('shop.bank_transfer.details') as $label => $value)
            <dt class="text-ink-3">{{ $label }}</dt>
            <dd class="font-medium break-all">{{ $value }}</dd>
        @endforeach
    </dl>
    <p class="mt-3 text-[13px] text-ink-2">{{ config('shop.bank_transfer.note') }}</p>
</div>
