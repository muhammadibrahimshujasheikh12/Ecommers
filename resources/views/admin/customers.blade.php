{{--
    Admin > Customers: paginated list of customer accounts.
    Variables: $customers (paginator of User with orders_count).
    The email links to the orders list filtered by that customer.
--}}
@extends('layouts.admin', ['title' => 'Customers'])

@section('content')
    <h1 class="text-4xl">Customers</h1>
    <div class="mt-6 overflow-x-auto border border-line bg-ivory">
        <table class="w-full text-[14px]">
            <thead class="bg-cream text-left font-ui text-[12px] uppercase tracking-[0.1em] text-ink-3">
                <tr><th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Phone</th><th class="p-3">Orders</th><th class="p-3">Joined</th></tr>
            </thead>
            <tbody>
                @forelse ($customers as $c)
                    <tr class="border-t border-line">
                        <td class="p-3">{{ $c->name }}</td>
                        <td class="p-3"><a href="{{ route('admin.orders', ['q' => $c->email]) }}" class="underline">{{ $c->email }}</a></td>
                        <td class="p-3">{{ $c->phone }}</td>
                        <td class="p-3">{{ $c->orders_count }}</td>
                        <td class="p-3">{{ $c->created_at->format('d M Y') }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="p-6 text-center text-ink-3">No customer accounts yet.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-6">{{ $customers->links() }}</div>
@endsection
