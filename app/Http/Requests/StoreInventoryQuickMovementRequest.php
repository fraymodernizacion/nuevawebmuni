<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInventoryQuickMovementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canUseInventoryQuickMovement() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'movement_type' => ['required', 'string', Rule::in(['exit', 'entry', 'recycled'])],
            'quantity' => ['required', 'integer', 'min:1', 'max:9999999999'],
            'reference' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $user = $this->user();
                $movementType = $this->string('movement_type')->toString();

                if (! $user) {
                    return;
                }

                $allowed = match ($movementType) {
                    'exit' => $user->canRecordInventoryExit(),
                    'entry' => $user->canRecordInventoryEntry(),
                    'recycled' => $user->canRecordInventoryRecycled(),
                    default => false,
                };

                if (! $allowed) {
                    $validator->errors()->add('movement_type', 'No tenes permiso para registrar este tipo de movimiento.');
                }
            },
        ];
    }
}
