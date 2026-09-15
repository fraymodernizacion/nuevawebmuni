<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class TrackComplaintRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $prefix = Str::of((string) $this->input('public_code_prefix'))
            ->squish()
            ->upper()
            ->replaceMatches('/[^A-Z0-9]/', '')
            ->toString();
        $year = preg_replace('/\D+/', '', (string) $this->input('public_code_year')) ?? '';
        $number = preg_replace('/\D+/', '', (string) $this->input('public_code_number')) ?? '';
        $publicCode = Str::of((string) $this->input('public_code'))->squish()->upper()->toString();

        if ($publicCode === '' && $prefix !== '' && $year !== '' && $number !== '') {
            $publicCode = sprintf('%s-%s-%06d', $prefix, $year, (int) $number);
        }

        $this->merge([
            'public_code' => $publicCode,
            'public_code_prefix' => $prefix,
            'public_code_year' => $year,
            'public_code_number' => $number,
            'dni' => preg_replace('/\D+/', '', (string) $this->input('dni')) ?? '',
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'public_code' => ['required_without:public_code_number', 'string', 'max:32'],
            'public_code_prefix' => ['required_without:public_code', 'string', 'max:10'],
            'public_code_year' => ['required_without:public_code', 'digits:4'],
            'public_code_number' => ['required_without:public_code', 'digits_between:1,6'],
            'dni' => ['required', 'digits_between:7,9'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'public_code.required_without' => 'Ingresá el número del reclamo.',
            'public_code_prefix.required_without' => 'Seleccioná el tipo de reclamo.',
            'public_code_year.required_without' => 'Ingresá el año del reclamo.',
            'public_code_year.digits' => 'Ingresá un año válido.',
            'public_code_number.required_without' => 'Ingresá el número del reclamo.',
            'public_code_number.digits_between' => 'Ingresá un número de reclamo válido.',
            'dni.required' => 'Ingresá el DNI usado al iniciar el reclamo.',
            'dni.digits_between' => 'Ingresá un DNI válido, solo con números.',
        ];
    }
}
