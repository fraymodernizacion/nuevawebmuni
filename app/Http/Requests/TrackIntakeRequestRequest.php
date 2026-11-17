<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class TrackIntakeRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'year' => ['required', 'string', 'regex:/\A[1-9][0-9]{3}\z/'],
            'number' => ['required', 'string', 'regex:/\A(?:[0-9]{1,16}|[A-Z][A-Z0-9]{0,23})\z/'],
            'applicant_dni' => ['required', 'string', 'regex:/\A[0-9]{1,8}\z/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $number = $this->input('number');

        if (! is_string($number)) {
            return;
        }

        $number = strtoupper(trim($number));

        if (preg_match('/\AFME-([0-9]{4})-([A-Z0-9]+)\z/', $number, $parts)) {
            $this->merge(['year' => $parts[1], 'number' => $parts[2]]);

            return;
        }

        $this->merge(['number' => $number]);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'year.required' => 'Ingresá el año que figura en el código de tu trámite.',
            'year.regex' => 'Ingresá el año con cuatro números, por ejemplo 2026.',
            'number.required' => 'Ingresá el número de tu trámite.',
            'number.regex' => 'Ingresá el número final o pegá el código completo del trámite.',
            'applicant_dni.required' => 'Ingresá el DNI que usaste al iniciar el trámite.',
            'applicant_dni.regex' => 'Ingresá solo los números de tu DNI, sin puntos ni espacios.',
        ];
    }

    public function publicCode(): string
    {
        $number = $this->validated('number');

        if (ctype_digit($number)) {
            $number = str_pad(ltrim($number, '0'), 6, '0', STR_PAD_LEFT);
        }

        return sprintf('FME-%s-%s', $this->validated('year'), $number);
    }
}
