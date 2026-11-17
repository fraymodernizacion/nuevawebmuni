<?php

namespace App\Http\Requests;

use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
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
        $rules = [
            'applicant_name' => ['required', 'string', 'max:160'],
            'applicant_dni' => ['required', 'string', 'regex:/\A[0-9]{1,8}\z/'],
            'applicant_phone' => ['required', 'string', 'max:40'],
            'applicant_email' => ['nullable', 'email', 'max:255'],
            'applicant_address' => ['nullable', 'string', 'max:255'],
            'intake_request_subtype_id' => ['nullable', 'integer', Rule::exists('intake_request_subtypes', 'id')],
            'summary' => ['nullable', 'string', 'max:5000'],
            'fields' => ['nullable', 'array'],
            'fields.*' => ['nullable', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ];

        $type = $this->route('type');
        $schema = $this->selectedSubtype()?->schema ?? ($type instanceof IntakeRequestType ? $type->schema : []);

        foreach ($schema ?? [] as $field) {
            $rules["fields.{$field['name']}"] = [
                ($field['required'] ?? false) ? 'required' : 'nullable',
                'string',
                'max:5000',
                ...match ($field['type'] ?? 'text') {
                    'select' => [Rule::in($field['options'] ?? [])],
                    'date' => ['date_format:Y-m-d'],
                    'time' => ['date_format:H:i'],
                    default => [],
                },
            ];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'applicant_dni.required' => 'Ingresá el DNI de quien presenta la solicitud.',
            'applicant_dni.regex' => 'Ingresá solo los números de tu DNI, sin puntos ni espacios.',
            'attachments.max' => 'Podés adjuntar hasta 5 archivos. Quitá los que sobran.',
            'attachments.*.uploaded' => 'El servidor no pudo recibir este archivo. Seleccionalo de nuevo y verificá que no supere los 10 MB.',
            'attachments.*.max' => 'Cada archivo debe pesar hasta 10 MB. Quitá el archivo que supera el límite.',
            'attachments.*.mimes' => 'Elegí un archivo PDF, Word o una imagen JPG, PNG o WebP.',
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
                if ($this->integer('intake_request_subtype_id') !== 0 && ! $this->selectedSubtype()) {
                    $validator->errors()->add('intake_request_subtype_id', 'El tramite especifico seleccionado no corresponde a esta categoria.');
                }

                if ($type instanceof IntakeRequestType && $type->subtypes()->where('active', true)->where('publication_status', 'published')->exists() && ! $this->selectedSubtype()) {
                    $validator->errors()->add('intake_request_subtype_id', 'Selecciona el tramite especifico.');
                }

            },
        ];
    }

    public function selectedSubtype(): ?IntakeRequestSubtype
    {
        $type = $this->route('type');
        $subtypeId = $this->integer('intake_request_subtype_id');

        if (! $type instanceof IntakeRequestType || $subtypeId === 0) {
            return null;
        }

        return IntakeRequestSubtype::query()
            ->whereBelongsTo($type, 'type')
            ->whereKey($subtypeId)
            ->where('active', true)
            ->where('publication_status', 'published')
            ->first();
    }
}
