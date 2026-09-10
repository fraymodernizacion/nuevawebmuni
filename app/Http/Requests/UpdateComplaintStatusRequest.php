<?php

namespace App\Http\Requests;

use App\Enums\ComplaintPriority;
use App\Enums\ComplaintStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateComplaintStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('complaint')) ?? false;
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
                ComplaintStatus::New->value,
                ComplaintStatus::UnderReview->value,
                ComplaintStatus::Assigned->value,
                ComplaintStatus::Closed->value,
                ComplaintStatus::Cancelled->value,
            ])],
            'priority' => ['nullable', Rule::enum(ComplaintPriority::class)],
            'observation' => ['nullable', 'string', 'max:4000'],
            'location_needs_verification' => ['nullable', 'boolean'],
            'send_whatsapp' => ['nullable', 'boolean'],
        ];
    }
}
