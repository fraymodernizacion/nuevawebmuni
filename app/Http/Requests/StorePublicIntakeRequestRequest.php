<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePublicIntakeRequestRequest extends FormRequest
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
            'applicant_name' => ['required', 'string', 'max:160'],
            'applicant_dni' => ['nullable', 'string', 'max:40'],
            'applicant_phone' => ['required', 'string', 'max:40'],
            'applicant_email' => ['nullable', 'email', 'max:255'],
            'applicant_address' => ['nullable', 'string', 'max:255'],
            'summary' => ['required', 'string', 'max:5000'],
            'fields' => ['nullable', 'array'],
            'fields.*' => ['nullable', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $type = $this->route('type');
                $schema = is_object($type) ? ($type->schema ?? []) : [];
                $fields = $this->input('fields', []);

                foreach ($schema as $field) {
                    if (($field['required'] ?? false) && blank($fields[$field['name']] ?? null)) {
                        $validator->errors()->add("fields.{$field['name']}", 'Este campo es obligatorio.');
                    }
                }
            },
        ];
    }
}
