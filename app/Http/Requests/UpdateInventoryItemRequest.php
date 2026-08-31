<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryItemRequest extends FormRequest
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
        $inventoryItem = $this->route('inventoryItem');

        return [
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'code')->ignore($inventoryItem),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit' => ['required', 'string', 'max:50'],
            'current_stock' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'minimum_stock' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
