<?php

namespace App\Http\Requests;

use App\Models\IntakeAssistanceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIntakeAssistanceTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canConfigureIntake() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'default_intake_department_id' => ['nullable', 'integer', 'exists:intake_departments,id'],
            'name' => ['required', 'string', 'max:160'],
            'slug' => [
                'required',
                'alpha_dash',
                'max:120',
                Rule::unique('intake_assistance_types', 'slug')->ignore($this->assistanceType()),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'color' => ['required', 'string', 'max:20'],
            'active' => ['boolean'],
        ];
    }

    private function assistanceType(): ?IntakeAssistanceType
    {
        $assistanceType = $this->route('intakeAssistanceType');

        return $assistanceType instanceof IntakeAssistanceType ? $assistanceType : null;
    }
}
