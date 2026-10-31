<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

/**
 * Customer and admin sign-in, registration and sign-out (session based).
 */
class AuthController extends Controller
{
    /** Show the sign-in form. */
    public function showLogin()
    {
        return view('auth.login');
    }

    /**
     * Sign a user in and send admins to the dashboard, customers to their account
     * (unless they were heading somewhere specific first).
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            // One generic message so we do not reveal which emails are registered.
            return back()->withInput($request->only('email'))->withErrors(['email' => 'Incorrect email or password.']);
        }

        // New session id after login prevents session fixation.
        $request->session()->regenerate();

        return redirect()->intended(route(Auth::user()->is_admin ? 'admin.dashboard' : 'account'));
    }

    /** Show the registration form. */
    public function showRegister()
    {
        return view('auth.register');
    }

    /** Create a customer account and sign them straight in. */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        Auth::login(User::create($data));
        $request->session()->regenerate();

        return redirect()->route('account')->with('status', 'Welcome to Closet Stories!');
    }

    /** Sign out, wiping the session but keeping the shopping bag. */
    public function logout(Request $request)
    {
        $cart = $request->session()->get('cart');

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($cart) {
            $request->session()->put('cart', $cart);
        }

        return redirect()->route('home');
    }
}
