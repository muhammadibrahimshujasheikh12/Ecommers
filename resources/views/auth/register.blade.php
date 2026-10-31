{{--
    Customer registration form (AuthController@showRegister). No variables;
    posts name, email, optional phone and a confirmed password.
--}}
@extends('layouts.app', ['title' => 'Create account'])

@section('content')
    <div class="mx-auto max-w-md px-4 py-16">
        <h1 class="text-center text-5xl">Create account</h1>
        <form method="POST" action="{{ route('register') }}" class="mt-10 space-y-5">
            @csrf
            <x-field name="name" label="Full name" required :value="old('name')" autocomplete="name" />
            <x-field name="email" label="Email" type="email" required :value="old('email')" autocomplete="email" />
            <x-field name="phone" label="Phone (optional)" type="tel" :value="old('phone')" autocomplete="tel" />
            {{-- Passwords are never re-filled from old input --}}
            <x-field name="password" label="Password" type="password" required autocomplete="new-password" />
            <x-field name="password_confirmation" label="Confirm password" type="password" required autocomplete="new-password" />
            <button class="btn w-full">Create account</button>
        </form>
        <p class="mt-6 text-center text-[14px] text-ink-2">Already have an account? <a href="{{ route('login') }}" class="underline">Sign in</a></p>
    </div>
@endsection
