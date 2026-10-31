{{--
    Breadcrumb trail that always starts at Home.

    Props:
      links   – ordered [label => url] pairs between Home and the current page
                (null-safe: callers may pass an empty array)
      current – label of the page being viewed (not linked)
--}}
@props(['links' => [], 'current'])

<nav class="font-ui text-[12px] text-ink-3">
    <a href="{{ route('home') }}">Home</a> /
    @foreach ($links as $label => $url)
        <a href="{{ $url }}">{{ $label }}</a> /
    @endforeach
    <span class="text-charcoal">{{ $current }}</span>
</nav>
