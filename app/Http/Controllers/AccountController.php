<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

/**
 * The signed-in customer's account page: profile details and order history.
 */
class AccountController extends Controller
{
    /**
     * Show the account page.
     *
     * Orders are matched by user id OR email, so orders placed as a guest
     * before registering with the same email still show up.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return view('account.index', [
            'user' => $user,
            'orders' => Order::with('items')
                ->where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->latest()
                ->get(),
        ]);
    }

    /** Save the customer's name and phone number. */
    public function update(Request $request)
    {
        $request->user()->update($request->validate([
            'name' => ['required', 'string', 'max:80'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]));

        return back()->with('status', 'Details saved.');
    }
}
