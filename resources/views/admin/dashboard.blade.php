{{--
    Admin > Dashboard: headline stats and the latest orders.
    Variables: $stats (label => value), $recent (latest orders).
--}}
@extends('layouts.admin', ['title' => 'Dashboard'])

@section('content')
    <h1 class="text-4xl">Dashboard</h1>
    <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        @foreach ($stats as $label => $value)
            <div class="border border-line bg-ivory p-5">
                <p class="eyebrow">{{ $label }}</p>
                <p class="mt-2 font-display text-3xl">{{ $value }}</p>
            </div>
        @endforeach
    </div>

    <h2 class="mt-10 text-2xl">Recent orders</h2>
    @include('admin.partials.orders-table', ['orders' => $recent])
@endsection
