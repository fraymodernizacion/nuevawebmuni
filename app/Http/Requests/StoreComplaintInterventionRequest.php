<?php

namespace App\Http\Requests;

use App\Enums\ComplaintPhotoType;
use App\Enums\ComplaintStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreComplaintInterventionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('intervene', $this->route('complaint')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                ComplaintStatus::InProgress->value,
                ComplaintStatus::NeedsSecondVisit->value,
                ComplaintStatus::Resolved->value,
            ])],
            'response_code' => ['nullable', 'string', Rule::in(collect(config('complaint_responses.crew', []))->pluck('code')->all())],
            'citizen_message' => ['nullable', 'required_if:status,'.ComplaintStatus::Resolved->value, 'string', 'max:8000'],
            'observations' => ['nullable', 'string', 'max:8000'],
            'internal_supplies_notes' => ['nullable', 'string', 'max:8000'],
            'second_visit_reason' => ['nullable', 'string', 'max:4000'],
            'suggested_second_visit_date' => ['nullable', 'date'],
            'photos' => ['nullable', 'array', 'max:6'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'photo_type' => ['nullable', Rule::in([ComplaintPhotoType::Intervention->value, ComplaintPhotoType::Resolution->value])],
            'materials' => ['nullable', 'array', 'max:30'],
            'materials.*.inventory_item_id' => ['required_with:materials', 'integer', 'exists:inventory_items,id'],
            'materials.*.quantity' => ['required_with:materials', 'integer', 'min:1', 'max:99999'],
            'send_whatsapp' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->input('status') !== ComplaintStatus::NeedsSecondVisit->value) {
                    return;
                }

                if (filled($this->input('response_code')) || filled($this->input('citizen_message')) || filled($this->input('observations')) || filled($this->input('second_visit_reason'))) {
                    return;
                }

                $validator->errors()->add('response_code', 'Selecciona un motivo o agrega una observacion para justificar la nueva visita.');
            },
        ];
    }
}
