<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the admin product form, used for both creating and editing.
 *
 * Access is already restricted by the EnsureAdmin middleware on the route group.
 */
class SaveProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand' => ['nullable', 'string', 'max:80'],
            // Prices are whole rupees.
            'price' => ['required', 'integer', 'min:0'],
            'compare_at_price' => ['nullable', 'integer', 'min:0'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'material' => ['nullable', 'string', 'max:255'],
            'care_instructions' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:40'],
            'color_hex' => ['nullable', 'string', 'max:9'],
            // One row per size; blank rows are dropped when saving.
            'sizes' => ['required', 'array', 'min:1'],
            'sizes.*.size' => ['nullable', 'string', 'max:20'],
            'sizes.*.stock' => ['nullable', 'integer', 'min:0'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['image', 'max:8192'],
            'featured' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
