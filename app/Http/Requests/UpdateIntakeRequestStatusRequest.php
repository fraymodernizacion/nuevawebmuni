<?php

namespace App\Http\Requests;

use App\Enums\IntakeRequestStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIntakeRequestStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canUseIntakeManagement() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(IntakeRequestStatus::class)],
            'area' => ['nullable', 'string', 'max:160'],
            'public_comment' => ['nullable', 'string', 'max:5000'],
            'internal_comment' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
