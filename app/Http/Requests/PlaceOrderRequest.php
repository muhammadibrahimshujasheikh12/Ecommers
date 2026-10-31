<?php

namespace App\Http\Requests;

use App\Http\Controllers\CheckoutController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the checkout form (contact, delivery address, shipping and payment).
 *
 * Anyone may place an order (guest checkout), so authorize() is always true.
 */
class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:160'],
            // Loose international format: optional "+", 10-16 digits/spaces/dashes.
            'phone' => ['required', 'regex:/^\+?[0-9\s\-]{10,16}$/'],
            'first_name' => ['required', 'string', 'max:60'],
            'last_name' => ['required', 'string', 'max:60'],
            'address_line_1' => ['required', 'string', 'max:200'],
            'address_line_2' => ['nullable', 'string', 'max:200'],
            // The city decides the delivery rate (Karachi vs rest of Pakistan).
            'city' => ['required', 'string', 'min:2', 'max:80'],
            'province' => ['nullable', 'string', 'max:60'],
            'postal_code' => ['nullable', 'string', 'max:12'],
            'country' => ['required', Rule::in(array_keys(CheckoutController::COUNTRIES))],
            'shipping_method' => ['nullable', 'string'],
            // Only the methods configured in config/shop.php (cod, bank_transfer).
            'payment_method' => ['required', Rule::in(array_keys(config('shop.payment_methods')))],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['phone.regex' => 'Enter a valid phone number, e.g. +92 300 1234567.'];
    }
}
