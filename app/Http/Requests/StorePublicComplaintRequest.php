<?php

namespace App\Http\Requests;

use App\Models\ComplaintCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StorePublicComplaintRequest extends FormRequest
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
        $fullName = Str::of((string) ($this->input('full_name') ?: trim($this->input('first_name').' '.$this->input('last_name'))))
            ->squish()
            ->toString();
        $nameParts = explode(' ', $fullName, 2);

        $this->merge([
            'full_name' => $fullName,
            'first_name' => $nameParts[0] ?? '',
            'last_name' => $nameParts[1] ?? '',
            'dni' => $this->digitsOnly((string) $this->input('dni')),
            'phone' => $this->normalizeArgentinianPhone((string) $this->input('phone')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $category = $this->route('category');

        abort_unless($category instanceof ComplaintCategory && $category->active, 404);

        return [
            'full_name' => ['required', 'string', 'max:240'],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'dni' => ['required', 'digits_between:7,9'],
            'phone' => ['required', 'string', 'regex:/^(?:54)?(?:9)?\d{10}$/', 'max:14'],
            'email' => ['nullable', 'email', 'max:255'],
            'complaint_type_id' => [
                'required',
                Rule::exists('complaint_types', 'id')
                    ->where('complaint_category_id', $category->id)
                    ->where('active', true),
            ],
            'other_problem_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:4000'],
            'location_reference' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:160'],
            'street_number' => ['nullable', 'string', 'max:40'],
            'neighborhood' => ['nullable', 'string', 'max:160'],
            'locality_id' => ['nullable', Rule::exists('localities', 'id')->where('active', true)],
            'latitude' => ['required_without:locality_id', 'numeric', 'between:-90,90'],
            'longitude' => ['required_without:locality_id', 'numeric', 'between:-180,180'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'dni.required' => 'Ingresá tu DNI para registrar el reclamo.',
            'dni.digits_between' => 'Ingresá un DNI válido, solo con números.',
            'phone.regex' => 'Ingresá un celular argentino válido, con o sin 54 y sin el 0 inicial.',
            'latitude.required_without' => 'Marca el lugar del problema en el mapa.',
            'longitude.required_without' => 'Marca el lugar del problema en el mapa.',
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
