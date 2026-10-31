{{--
    Admin > Order detail: items, totals, status/payment update form and
    customer + delivery address.
    Variables: $order (Order with items; shipping_address is an array).
--}}
@extends('layouts.admin', ['title' => $order->order_number])

{{-- Short alias for the stored address array --}}
@php($a = $order->shipping_address)

@section('content')
    <a href="{{ route('admin.orders') }}" class="font-ui text-[13px] text-ink-3">← Orders</a>
    <h1 class="mt-2 text-4xl">{{ $order->order_number }}</h1>
    <p class="text-ink-3">{{ $order->created_at->format('d M Y, H:i') }}</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {{-- Items and totals (prices are snapshots taken when the order was placed) --}}
        <div class="border border-line bg-ivory p-5">
            <ul class="divide-y divide-line">
                @foreach ($order->items as $item)
                    <li class="flex gap-3 py-3">
                        <img src="{{ $item->image_url }}" alt="" class="aspect-[3/4] w-14 object-cover">
                        <div class="flex-1 text-[14px]">
                            <a href="{{ route('product', $item->product_slug) }}" target="_blank" class="underline">{{ $item->product_name }}</a>
                            <p class="text-ink-3">{{ $item->variant_name }} × {{ $item->quantity }}</p>
                        </div>
                        <p class="font-ui text-[14px]">{{ rs($item->price * $item->quantity) }}</p>
                    </li>
                @endforeach
            </ul>
            <dl class="mt-4 space-y-1 border-t border-line pt-4 font-ui text-[14px]">
                <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ rs($order->subtotal) }}</dd></div>
                <div class="flex justify-between"><dt>{{ $order->shipping_method_name }}</dt><dd>{{ rs($order->shipping_cost) }}</dd></div>
                <div class="flex justify-between text-[16px] font-medium"><dt>Total</dt><dd>{{ rs($order->total) }}</dd></div>
            </dl>
            @if ($order->notes)
                <p class="mt-4 bg-cream p-3 text-[14px]"><strong>Notes:</strong> {{ $order->notes }}</p>
            @endif
        </div>

        <div class="space-y-6">
            {{-- Status / payment update --}}
            <form method="POST" action="{{ route('admin.orders.update', $order) }}" class="space-y-4 border border-line bg-ivory p-5">
                @csrf @method('PATCH')
                <div>
                    <label class="label">Order status</label>
                    <select name="status" class="field">
                        @foreach (\App\Models\Order::STATUSES as $s)
                            <option value="{{ $s }}" @selected($order->status === $s)>{{ ucfirst($s) }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="label">Payment ({{ $order->payment_label }})</label>
                    <select name="payment_status" class="field">
                        @foreach (['unpaid', 'paid', 'refunded'] as $s)
                            <option value="{{ $s }}" @selected($order->payment_status === $s)>{{ ucfirst($s) }}</option>
                        @endforeach
                    </select>
                </div>
                <button class="btn w-full">Update order</button>
            </form>

            {{-- Customer contact and delivery address --}}
            <div class="border border-line bg-ivory p-5 text-[14px]">
                <p class="eyebrow mb-2">Customer</p>
                <p>{{ $a['first_name'] }} {{ $a['last_name'] }}</p>
                <p><a href="tel:{{ $order->phone }}" class="underline">{{ $order->phone }}</a></p>
                <p><a href="mailto:{{ $order->email }}" class="underline">{{ $order->email }}</a></p>
                <p class="eyebrow mt-4 mb-2">Ship to</p>
                <p>{{ $a['address_line_1'] }}@if ($a['address_line_2'] ?? null)<br>{{ $a['address_line_2'] }}@endif<br>{{ $a['city'] }}{{ ($a['province'] ?? null) ? ', '.$a['province'] : '' }} {{ $a['postal_code'] ?? '' }}<br>{{ $a['country'] }}</p>
            </div>
        </div>
    </div>
@endsection
