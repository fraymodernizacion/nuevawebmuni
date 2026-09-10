<?php

namespace App\Http\Requests;

use App\Models\Complaint;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreWorkRouteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) config('complaints.route_planning_enabled')
            && ($this->user()?->canCoordinateCrews() ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'operational_zone_id' => ['required', Rule::exists('operational_zones', 'id')->where('active', true)],
            'crew_id' => ['required', Rule::exists('crews', 'id')->where('active', true)],
            'complaint_ids' => ['required', 'array', 'min:1'],
            'complaint_ids.*' => ['integer', Rule::exists('complaints', 'id')],
            'notes' => ['nullable', 'string', 'max:4000'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $complaintIds = collect($this->input('complaint_ids', []))
                    ->filter()
                    ->unique()
                    ->values();

                if ($complaintIds->isEmpty() || blank($this->input('operational_zone_id'))) {
                    return;
                }

                $matchingComplaints = Complaint::whereKey($complaintIds)
                    ->where('operational_zone_id', $this->integer('operational_zone_id'))
                    ->count();

                if ($matchingComplaints !== $complaintIds->count()) {
                    $validator->errors()->add(
                        'complaint_ids',
                        'Los reclamos seleccionados deben pertenecer a la zona elegida.',
                    );
                }
            },
        ];
    }
}
