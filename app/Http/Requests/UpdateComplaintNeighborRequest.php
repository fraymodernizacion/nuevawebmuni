<?php

namespace App\Http\Requests;

use App\Models\Complaint;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class UpdateComplaintNeighborRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $complaint = $this->route('complaint');

        return $complaint instanceof Complaint
            && ($this->user()?->can('update', $complaint) ?? false)
            && ($this->user()?->canUseComplaintManagement() ?? false);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => Str::of((string) $this->input('first_name'))->squish()->toString(),
            'last_name' => Str::of((string) $this->input('last_name'))->squish()->toString(),
            'dni' => $this->digitsOnly((string) $this->input('dni')),
            'phone' => $this->normalizeArgentinianPhone((string) $this->input('phone')),
            'email' => filled($this->input('email')) ? Str::of((string) $this->input('email'))->squish()->lower()->toString() : null,
            'street' => Str::of((string) $this->input('street'))->squish()->toString(),
            'street_number' => Str::of((string) $this->input('street_number'))->squish()->toString(),
            'neighborhood' => Str::of((string) $this->input('neighborhood'))->squish()->toString(),
            'location_reference' => Str::of((string) $this->input('location_reference'))->squish()->toString(),
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
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'dni' => ['required', 'digits_between:7,9'],
            'phone' => ['required', 'string', 'regex:/^(?:54)?(?:9)?\d{10}$/', 'max:14'],
            'email' => ['nullable', 'email', 'max:255'],
            'street' => ['nullable', 'string', 'max:160'],
            'street_number' => ['nullable', 'string', 'max:40'],
            'neighborhood' => ['nullable', 'string', 'max:160'],
            'location_reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'dni.required' => 'Ingresa el DNI del vecino.',
            'dni.digits_between' => 'Ingresa un DNI valido, solo con numeros.',
            'phone.regex' => 'Ingresa un celular argentino valido, con o sin 54 y sin el 0 inicial.',
        ];
    }

    private function digitsOnly(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }

    private function normalizeArgentinianPhone(string $phone): string
    {
        $digits = $this->digitsOnly($phone);

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        if (str_starts_with($digits, '549') && strlen($digits) === 13) {
            return $digits;
        }

        if (str_starts_with($digits, '54') && strlen($digits) === 12) {
            return '549'.substr($digits, 2);
        }

        if (str_starts_with($digits, '9') && strlen($digits) === 11) {
            return '54'.$digits;
        }

        if (strlen($digits) === 10) {
            return '549'.$digits;
        }

        return $digits;
    }
}
