<?php

namespace App\Http\Requests;

use App\Support\InventoryItemCategories;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageInventory() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_code' => ['required', 'string', Rule::in(InventoryItemCategories::codes()->all())],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit' => ['required', 'string', 'max:50'],
            'current_stock' => ['required', 'integer', 'min:0', 'max:9999999999'],
            'minimum_stock' => ['required', 'integer', 'min:0', 'max:9999999999'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
