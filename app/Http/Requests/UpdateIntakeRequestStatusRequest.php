<?php

namespace App\Http\Requests;

use App\Enums\IntakeRequestStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIntakeRequestStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in(array_column(IntakeRequestStatus::options(), 'value'))],
            'area' => ['nullable', 'string', 'max:160'],
            'public_comment' => [
                Rule::requiredIf(in_array($this->input('status'), [
                    IntakeRequestStatus::NeedsDocumentation->value,
                ], true)),
                'nullable',
                'string',
                'max:5000',
            ],
            'internal_comment' => ['nullable', 'string', 'max:5000'],
            'submission_id' => ['nullable', 'uuid'],
            'response_documents' => ['nullable', 'array', 'max:5'],
            'response_documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'status.required' => 'Seleccioná un estado.',
            'status.enum' => 'Seleccioná un estado válido.',
            'status.in' => 'Seleccioná un estado válido.',
            'area.max' => 'El área o sector admite hasta 160 caracteres.',
            'public_comment.required' => $this->input('status') === IntakeRequestStatus::NeedsDocumentation->value
                ? 'Indicá qué documentación debe presentar el vecino.'
                : 'Escribí la respuesta que verá el vecino.',
            'public_comment.max' => 'El mensaje admite hasta 5000 caracteres.',
            'internal_comment.max' => 'La nota interna admite hasta 5000 caracteres.',
            'response_documents.max' => 'Podés publicar hasta 5 documentos por actualización.',
            'response_documents.*.max' => 'Cada archivo debe pesar hasta 10 MB.',
            'response_documents.*.mimes' => 'Elegí archivos PDF, Word o imágenes JPG, PNG o WebP.',
            'response_documents.*.uploaded' => 'No se pudo recibir el documento. Volvé a seleccionarlo.',
        ];
    }
}
