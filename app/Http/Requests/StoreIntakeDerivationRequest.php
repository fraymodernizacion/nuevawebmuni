<?php

namespace App\Http\Requests;

use App\Models\IntakeAssistanceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreIntakeDerivationRequest extends FormRequest
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
            'assistance_type_ids' => ['required', 'array', 'min:1'],
            'assistance_type_ids.*' => ['integer', 'exists:intake_assistance_types,id'],
            'department_ids' => ['nullable', 'array'],
            'department_ids.*' => ['integer', 'exists:intake_departments,id'],
            'operator_note' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<int, int>
     */
    public function targetDepartmentIds(): array
    {
        $selectedDepartments = collect($this->validated('department_ids', []));
        $defaultDepartments = IntakeAssistanceType::query()
            ->whereIn('id', $this->validated('assistance_type_ids', []))
            ->whereNotNull('default_intake_department_id')
            ->pluck('default_intake_department_id');

        return $selectedDepartments
            ->merge($defaultDepartments)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
