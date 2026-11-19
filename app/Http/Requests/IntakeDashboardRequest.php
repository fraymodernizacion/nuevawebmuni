<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IntakeDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canUseIntakeManagement() ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'secretariat' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'year.integer' => 'Seleccioná un año válido.',
            'year.min' => 'El año debe ser igual o posterior a 2000.',
            'year.max' => 'El año debe ser igual o anterior a 2100.',
            'month.integer' => 'Seleccioná un mes válido.',
            'month.between' => 'Seleccioná un mes entre enero y diciembre.',
            'secretariat.max' => 'Seleccioná una secretaría válida.',
        ];
    }
}
