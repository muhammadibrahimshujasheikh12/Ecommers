{{--
    One collapsible section of the product page's info accordion
    (native <details>, so it works without JavaScript).

    Props:
      title – summary text shown in the header row
      open  – start expanded (used for the Description section)
    Slot: the section body.
--}}
@props(['title', 'open' => false])

<details @if ($open) open @endif class="border-b border-line py-4">
    <summary class="cursor-pointer font-ui text-[13px] font-medium uppercase tracking-[0.16em]">{{ $title }}</summary>
    {{ $slot }}
</details>
