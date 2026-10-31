{{--
    Customer account: order history and editable profile details.

    Variables (AccountController@index):
      $user   – the signed-in User
      $orders – orders placed by this user or with their email (so guest orders show too), with items
--}}
@extends('layouts.app', ['title' => 'My account'])

@section('content')
    <div class="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
            <h1 class="text-5xl">Hello, {{ Str::before($user->name, ' ') }}</h1>
            <form method="POST" action="{{ route('logout') }}">@csrf<button class="btn-outline">Sign out</button></form>
        </div>

        <div class="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">
            {{-- Order history: each order links to its confirmation page via the order's access token --}}
            <section>
                <h2 class="text-2xl">My orders</h2>
                @forelse ($orders as $order)
                    <a href="{{ route('checkout.confirmation', $order->access_token) }}" class="mt-4 flex items-center justify-between gap-4 border border-line p-4 hover:border-charcoal">
                        <div>
                            <p class="font-ui text-[14px] font-medium">{{ $order->order_number }}</p>
                            <p class="text-[13px] text-ink-3">{{ $order->created_at->format('d M Y') }} · {{ $order->items->sum('quantity') }} items · {{ $order->payment_label }}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-ui text-[14px]">{{ rs($order->total) }}</p>
                            <p class="text-[12px] uppercase tracking-[0.1em] text-ink-3">{{ $order->status }}</p>
                        </div>
                    </a>
                @empty
                    <p class="mt-4 text-ink-2">No orders yet. <a href="{{ route('shop') }}" class="underline">Start shopping</a></p>
                @endforelse
            </section>

            {{-- Profile: name and phone are editable; email is shown read-only (it is the login) --}}
            <section>
                <h2 class="text-2xl">My details</h2>
                <form method="POST" action="{{ route('account.update') }}" class="mt-4 space-y-4">
                    @csrf @method('PATCH')
                    <x-field name="name" label="Name" required :value="old('name', $user->name)" />
                    <x-field name="phone" label="Phone" :value="old('phone', $user->phone)" />
                    <div><label class="label">Email</label><input class="field bg-cream" value="{{ $user->email }}" disabled></div>
                    <button class="btn w-full">Save</button>
                </form>
            </section>
        </div>
    </div>
@endsection
