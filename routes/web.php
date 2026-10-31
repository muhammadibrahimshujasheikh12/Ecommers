<?php

/*
|--------------------------------------------------------------------------
| Web routes for the Closet Stories shop
|--------------------------------------------------------------------------
| Route names and URLs are referenced from views and tests: keep them stable.
| The catch-all policy page route must stay last.
*/

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ShopController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

// Storefront
Route::controller(ShopController::class)->group(function () {
    Route::get('/', 'home')->name('home');
    Route::get('/shop/{slug?}', 'index')->name('shop');
    Route::get('/product/{slug}', 'product')->name('product');
});

// Shopping bag (session based, works for guests)
Route::controller(CartController::class)->group(function () {
    Route::get('/cart', 'index')->name('cart');
    Route::post('/cart', 'add')->name('cart.add');
    Route::patch('/cart/{variant}', 'update')->name('cart.update');
});

// Checkout (guest checkout allowed; placing orders is rate limited)
Route::controller(CheckoutController::class)->group(function () {
    Route::get('/checkout', 'show')->name('checkout');
    Route::get('/checkout/quote', 'quote')->name('checkout.quote');
    Route::post('/checkout', 'place')->middleware('throttle:10,1')->name('checkout.place');
    Route::get('/checkout/confirmation/{token}', 'confirmation')->name('checkout.confirmation');
});

// Sign-in and registration (throttled against brute force)
Route::controller(AuthController::class)->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', 'showLogin')->name('login');
        Route::post('/login', 'login')->middleware('throttle:10,1');
        Route::get('/register', 'showRegister')->name('register');
        Route::post('/register', 'register')->middleware('throttle:10,1');
    });
    Route::post('/logout', 'logout')->middleware('auth')->name('logout');
});

// Customer account
Route::controller(AccountController::class)->middleware('auth')->group(function () {
    Route::get('/account', 'index')->name('account');
    Route::patch('/account', 'update')->name('account.update');
});

// Back office (admins only)
Route::prefix('admin')->name('admin.')->middleware(['auth', EnsureAdmin::class])
    ->controller(AdminController::class)->group(function () {
        Route::get('/', 'dashboard')->name('dashboard');

        Route::get('/orders', 'orders')->name('orders');
        Route::get('/orders/{order}', 'order')->name('orders.show');
        Route::patch('/orders/{order}', 'updateOrder')->name('orders.update');

        Route::get('/products', 'products')->name('products');
        Route::get('/products/new', 'createProduct')->name('products.create');
        Route::post('/products', 'storeProduct')->name('products.store');
        Route::get('/products/{product}', 'editProduct')->name('products.edit');
        Route::put('/products/{product}', 'updateProduct')->name('products.update');
        Route::delete('/products/{product}', 'destroyProduct')->name('products.destroy');

        Route::get('/customers', 'customers')->name('customers');
    });

// Policy pages: /shipping-policy, /return-policy, /faqs, /contact … (must stay last)
Route::get('/{slug}', [ShopController::class, 'page'])->where('slug', '[a-z0-9-]+')->name('page');
