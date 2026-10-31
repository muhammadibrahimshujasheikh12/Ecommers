{{--
    Admin > Orders: search (order no./email/phone) and status filter.
    Variables: $orders (paginator). Filters are plain GET query params.
--}}
@extends('layouts.admin', ['title' => 'Orders'])

@section('content')
    <h1 class="text-4xl">Orders</h1>
    <form class="mt-6 flex flex-wrap gap-3">
        <input name="q" value="{{ request('q') }}" placeholder="Order no., email or phone" class="field max-w-xs">
        <select name="status" class="field max-w-48" onchange="this.form.submit()">
            <option value="">All statuses</option>
            @foreach (\App\Models\Order::STATUSES as $s)
                <option value="{{ $s }}" @selected(request('status') === $s)>{{ ucfirst($s) }}</option>
            @endforeach
        </select>
        <button class="btn">Search</button>
    </form>
    @include('admin.partials.orders-table')
    <div class="mt-6">{{ $orders->links() }}</div>
@endsection
