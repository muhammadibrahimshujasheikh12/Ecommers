{{--
    "Thank you for your order" email (App\Mail\OrderPlaced).

    Variables: $order – Order with items; shipping_address is an array.
    Email clients ignore stylesheets, so styling is inline and the layout uses
    tables. Bank Transfer orders include the bank details and WhatsApp note
    from config('shop.bank_transfer'); COD orders get a pay-the-courier line.
--}}
@php($address = $order->shipping_address)
<!DOCTYPE html>
<html>
<body style="margin:0;background:#fbf8f3;font-family:Arial,sans-serif;color:#2a2826">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px">
    {{-- Masthead --}}
    <tr><td style="text-align:center;padding:16px 0">
        <h1 style="font-family:Georgia,serif;font-weight:normal;margin:0">Closet Stories</h1>
    </td></tr>

    <tr><td style="background:#fff;padding:24px;border:1px solid #e6ddd0">
        <h2 style="font-family:Georgia,serif;font-weight:normal;margin-top:0">Thank you for your order, {{ $address['first_name'] }}!</h2>
        <p>Order <strong>{{ $order->order_number }}</strong> · {{ $order->created_at->format('d M Y') }}</p>

        {{-- Items and totals --}}
        <table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:14px">
            @foreach ($order->items as $item)
                <tr style="border-bottom:1px solid #e6ddd0">
                    <td>{{ $item->product_name }}<br><span style="color:#736c64">{{ $item->variant_name }} × {{ $item->quantity }}</span></td>
                    <td align="right">{{ rs($item->price * $item->quantity) }}</td>
                </tr>
            @endforeach
            <tr><td>Subtotal</td><td align="right">{{ rs($order->subtotal) }}</td></tr>
            <tr><td>{{ $order->shipping_method_name }}</td><td align="right">{{ rs($order->shipping_cost) }}</td></tr>
            <tr><td><strong>Total</strong></td><td align="right"><strong>{{ rs($order->total) }}</strong></td></tr>
        </table>

        {{-- Payment instructions --}}
        <p><strong>Payment:</strong> {{ $order->payment_label }}</p>
        @if ($order->payment_method === 'bank_transfer')
            <div style="background:#f5efe6;padding:12px;font-size:14px">
                <p style="margin-top:0">Please transfer <strong>{{ rs($order->total) }}</strong> with reference <strong>{{ $order->order_number }}</strong>:</p>
                @foreach (config('shop.bank_transfer.details') as $label => $value)
                    <div>{{ $label }}: <strong>{{ $value }}</strong></div>
                @endforeach
                <p style="margin-bottom:0">{{ config('shop.bank_transfer.note') }}</p>
            </div>
        @else
            <p>Please keep {{ rs($order->total) }} ready for the courier.</p>
        @endif

        {{-- Delivery details and a link back to the confirmation page (by secret token) --}}
        <p><strong>Delivering to:</strong><br>{{ $address['first_name'] }} {{ $address['last_name'] }}, {{ $address['address_line_1'] }}, {{ $address['city'] }} · {{ $order->phone }}</p>
        <p><a href="{{ route('checkout.confirmation', $order->access_token) }}" style="color:#2a2826">View your order</a></p>
    </td></tr>

    {{-- Footer: shop contact details --}}
    <tr><td style="text-align:center;font-size:12px;color:#736c64;padding:16px">
        {{ config('shop.contact.phone') }} · {{ config('shop.contact.email') }}<br>{{ config('shop.contact.address') }}
    </td></tr>
</table>
</body>
</html>
