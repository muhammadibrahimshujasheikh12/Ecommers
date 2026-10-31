{{--
    Static CMS page (shipping policy, FAQs, terms, …).

    Variables (ShopController@page):
      $page – Page model: title, summary, content (Markdown)
--}}
@extends('layouts.app', ['title' => $page->title, 'description' => $page->summary])

@section('content')
    <article class="mx-auto max-w-3xl px-4 py-14 md:px-8">
        <h1 class="text-5xl">{{ $page->title }}</h1>
        @if ($page->summary)
            <p class="mt-4 text-lg text-ink-2">{{ $page->summary }}</p>
        @endif
        {{-- Markdown is rendered unescaped, so raw HTML and javascript: links are stripped for safety --}}
        <div class="prose-page mt-8">{!! Str::markdown($page->content, ['html_input' => 'strip', 'allow_unsafe_links' => false]) !!}</div>
    </article>
@endsection
