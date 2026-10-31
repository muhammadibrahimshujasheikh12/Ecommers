{{--
    Storefront layout: every customer-facing page extends this.

    Variables (passed via @extends('layouts.app', [...])):
      $title       – optional page title, prefixed to the shop name in <title>
      $description – optional meta description; defaults to config('shop.description')
    Section: "content" – the page body.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ isset($title) ? $title.' | ' : '' }}{{ config('shop.name') }} — Fashion for Women, Men &amp; Kids</title>
    <meta name="description" content="{{ $description ?? config('shop.description') }}">

    {{-- Favicons --}}
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/icon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-icon.png">

    {{-- Brand fonts: Bodoni Moda (display), Jost (UI), Open Sans (body) --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Jost:wght@400;500&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="flex min-h-screen flex-col">
    @include('partials.header')

    <main id="main" class="flex-1">
        {{-- One-off flash message set by controllers with ->with('status', ...) --}}
        @session('status')
            <div class="mx-auto mt-6 max-w-7xl px-4 md:px-8">
                <p class="border border-success/30 bg-success/10 px-4 py-3 text-[14px] text-success">{{ $value }}</p>
            </div>
        @endsession

        @yield('content')
    </main>

    @include('partials.footer')
</body>
</html>
