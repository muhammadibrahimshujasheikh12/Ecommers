{{--
    Admin layout: dark sidebar navigation + main content area.
    Variables: $title (optional, page title). Flashes session('status') and
    validation errors above every admin page, so child views need not.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>{{ $title ?? 'Admin' }} | Closet Stories Admin</title>
    <link rel="icon" href="/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&family=Jost:wght@400;500&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css'])
</head>
<body class="bg-cream">
    <div class="md:flex">
        {{-- Sidebar: horizontal scroll strip on mobile, fixed column on desktop --}}
        <aside class="bg-charcoal text-ivory md:min-h-screen md:w-60">
            <div class="flex items-center justify-between p-5 md:block">
                <a href="{{ route('admin.dashboard') }}" class="font-display text-2xl">Closet Stories</a>
                <p class="font-ui text-[11px] uppercase tracking-[0.2em] text-ivory/60">Admin</p>
            </div>
            <nav class="flex gap-1 overflow-x-auto px-3 pb-3 font-ui text-[14px] md:flex-col">
                @foreach (['admin.dashboard' => 'Dashboard', 'admin.orders' => 'Orders', 'admin.products' => 'Products', 'admin.customers' => 'Customers'] as $r => $l)
                    <a href="{{ route($r) }}" class="whitespace-nowrap px-3 py-2 {{ request()->routeIs($r.'*') ? 'bg-ivory/15' : 'hover:bg-ivory/10' }}">{{ $l }}</a>
                @endforeach
                <a href="{{ route('home') }}" target="_blank" class="whitespace-nowrap px-3 py-2 hover:bg-ivory/10">View shop ↗</a>
                <form method="POST" action="{{ route('logout') }}">@csrf<button class="w-full px-3 py-2 text-left whitespace-nowrap hover:bg-ivory/10">Sign out</button></form>
            </nav>
        </aside>
        <main class="flex-1 p-4 md:p-8">
            {{-- Flash message and validation errors for every admin page --}}
            @if (session('status'))
                <p class="mb-6 border border-success/30 bg-success/10 px-4 py-3 text-[14px] text-success">{{ session('status') }}</p>
            @endif
            @if ($errors->any())
                <div class="mb-6 border border-sale/30 bg-sale/10 px-4 py-3 text-[14px] text-sale">
                    @foreach ($errors->all() as $e) <p>{{ $e }}</p> @endforeach
                </div>
            @endif
            @yield('content')
        </main>
    </div>
</body>
</html>
