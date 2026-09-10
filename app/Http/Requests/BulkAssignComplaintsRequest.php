<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignComplaintsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canCoordinateCrews() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'crew_id' => ['required', Rule::exists('crews', 'id')->where('active', true)],
            'complaint_ids' => ['required', 'array', 'min:1'],
            'complaint_ids.*' => ['integer', Rule::exists('complaints', 'id')],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
