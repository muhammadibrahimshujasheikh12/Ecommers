{{--
    Orders table shared by the dashboard and the orders list.
    Variables: $orders (iterable of Order).
--}}
<div class="mt-4 overflow-x-auto border border-line bg-ivory">
    <table class="w-full text-[14px]">
        <thead class="bg-cream text-left font-ui text-[12px] uppercase tracking-[0.1em] text-ink-3">
            <tr><th class="p-3">Order</th><th class="p-3">Date</th><th class="p-3">Customer</th><th class="p-3">City</th><th class="p-3">Payment</th><th class="p-3">Status</th><th class="p-3 text-right">Total</th></tr>
        </thead>
        <tbody>
            @forelse ($orders as $o)
                <tr class="border-t border-line hover:bg-cream">
                    <td class="p-3"><a href="{{ route('admin.orders.show', $o) }}" class="font-medium underline">{{ $o->order_number }}</a></td>
                    <td class="p-3 whitespace-nowrap">{{ $o->created_at->format('d M, H:i') }}</td>
                    <td class="p-3">{{ $o->shipping_address['first_name'] }} {{ $o->shipping_address['last_name'] }}<br><span class="text-ink-3">{{ $o->phone }}</span></td>
                    <td class="p-3">{{ $o->shipping_address['city'] }}</td>
                    <td class="p-3">{{ $o->payment_label }}<br><span class="text-ink-3">{{ $o->payment_status }}</span></td>
                    <td class="p-3 capitalize">{{ $o->status }}</td>
                    <td class="p-3 text-right whitespace-nowrap">{{ rs($o->total) }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="p-6 text-center text-ink-3">No orders yet.</td></tr>
            @endforelse
        </tbody>
    </table>
</div>
