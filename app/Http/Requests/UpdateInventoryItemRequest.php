<?php

namespace App\Http\Requests;

use App\Support\InventoryItemCategories;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'category_code' => ['nullable', 'string', Rule::in(InventoryItemCategories::codes()->all())],
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'code')->ignore($inventoryItem),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit' => ['required', 'string', 'max:50'],
            'current_stock' => ['required', 'integer', 'min:0', 'max:9999999999'],
            'minimum_stock' => ['required', 'integer', 'min:0', 'max:9999999999'],
            'stock_adjustment_type' => ['nullable', 'string', Rule::in(['add', 'subtract'])],
            'stock_adjustment_quantity' => ['nullable', 'integer', 'min:1', 'max:9999999999'],
            'active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->filled('stock_adjustment_type')) {
                    return;
                }

                if (! $this->filled('stock_adjustment_quantity')) {
                    $validator->errors()->add('stock_adjustment_quantity', 'Ingresa la cantidad a ajustar.');

                    return;
                }

                $inventoryItem = $this->route('inventoryItem');

                if (
                    $this->string('stock_adjustment_type')->toString() === 'subtract'
                    && (float) $this->input('stock_adjustment_quantity') > (float) $inventoryItem->current_stock
                ) {
                    $validator->errors()->add('stock_adjustment_quantity', 'No podes restar mas stock del disponible.');
                }
            },
        ];
    }
}
