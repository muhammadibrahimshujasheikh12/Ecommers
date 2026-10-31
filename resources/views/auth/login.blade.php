{{--
    Sign-in form (AuthController@showLogin). No variables; posts email,
    password and "remember" to the login route. Admins and customers share it.
--}}
@extends('layouts.app', ['title' => 'Sign in'])

@section('content')
    <div class="mx-auto max-w-md px-4 py-16">
        <h1 class="text-center text-5xl">Sign in</h1>
        <form method="POST" action="{{ route('login') }}" class="mt-10 space-y-5">
            @csrf
            {{-- A failed login reports its error on "email", so the password field never shows one --}}
            <x-field name="email" label="Email" type="email" required autofocus :value="old('email')" autocomplete="email" />
            <x-field name="password" label="Password" type="password" required autocomplete="current-password" />
            <label class="flex items-center gap-2 text-[14px]"><input type="checkbox" name="remember" class="accent-charcoal"> Keep me signed in</label>
            <button class="btn w-full">Sign in</button>
        </form>
        <p class="mt-6 text-center text-[14px] text-ink-2">New here? <a href="{{ route('register') }}" class="underline">Create an account</a></p>
    </div>
@endsection
