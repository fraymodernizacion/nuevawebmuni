<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintStatus;
use App\Enums\IntakeDerivationStatus;
use App\Enums\IntakeRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIntakeDerivationRequest;
use App\Http\Requests\UpdateIntakeRequestStatusRequest;
use App\Models\Complaint;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeDerivation;
use App\Models\IntakeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntakeRequestController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canUseIntakeManagement(), 403);

        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        return Inertia::render('intake/admin/index', [
            'filters' => $request->only(['search', 'status']),
            'statuses' => IntakeRequestStatus::options(),
            'requests' => IntakeRequest::with('type:id,name,category,color')
                ->when($status, fn ($query) => $query->where('status', $status))
                ->when($search, fn ($query) => $query->where(function ($query) use ($search): void {
                    $query->where('public_code', 'like', "%{$search}%")
                        ->orWhere('applicant_name', 'like', "%{$search}%")
                        ->orWhere('applicant_phone', 'like', "%{$search}%")
                        ->orWhere('summary', 'like', "%{$search}%");
                }))
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'complaintSummary' => [
                'pending' => Complaint::whereIn('current_status', ComplaintStatus::pendingValues())->count(),
                'new' => Complaint::where('current_status', ComplaintStatus::New)->count(),
            ],
        ]);
    }

    public function show(Request $request, IntakeRequest $intakeRequest): Response
    {
        abort_unless($request->user()?->canUseIntakeManagement(), 403);

        $intakeRequest->load([
            'type',
            'histories.user:id,name',
            'attachments',
            'assistanceTypes.defaultDepartment:id,name,color',
            'derivations.department:id,name,color',
            'derivations.assistanceType:id,name,color',
            'derivations.lastUpdater:id,name',
        ]);

        return Inertia::render('intake/admin/show', [
            'request' => [
                ...$intakeRequest->toArray(),
                'status_label' => $intakeRequest->status->label(),
                'attachments' => $intakeRequest->attachments->map(fn ($attachment): array => [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'url' => $attachment->url(),
                    'type' => $attachment->type,
                    'created_at' => $attachment->created_at?->format('d/m/Y H:i'),
                ]),
                'derivations' => $intakeRequest->derivations->map(fn (IntakeDerivation $derivation): array => $this->derivationPayload($derivation)),
            ],
            'statuses' => IntakeRequestStatus::options(),
            'derivationStatuses' => IntakeDerivationStatus::options(),
            'assistanceTypes' => IntakeAssistanceType::query()
                ->with('defaultDepartment:id,name,color')
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'default_intake_department_id', 'name', 'color']),
            'departments' => IntakeDepartment::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'color']),
        ]);
    }

    public function storeDerivations(StoreIntakeDerivationRequest $request, IntakeRequest $intakeRequest): RedirectResponse
    {
        $validated = $request->validated();
        $previousStatus = $intakeRequest->status;
        $assistanceTypeIds = collect($validated['assistance_type_ids'])->map(fn (int|string $id): int => (int) $id)->values();
        $targetDepartmentIds = $request->targetDepartmentIds();

        $intakeRequest->assistanceTypes()->syncWithoutDetaching($assistanceTypeIds);

        foreach ($targetDepartmentIds as $departmentId) {
            $assistanceTypeId = IntakeAssistanceType::query()
                ->whereIn('id', $assistanceTypeIds)
                ->where('default_intake_department_id', $departmentId)
                ->value('id') ?? $assistanceTypeIds->first();

            IntakeDerivation::updateOrCreate(
                [
                    'intake_request_id' => $intakeRequest->id,
                    'intake_department_id' => $departmentId,
                    'intake_assistance_type_id' => $assistanceTypeId,
                ],
                [
                    'created_by' => $request->user()?->id,
                    'last_updated_by' => $request->user()?->id,
                    'operator_note' => $validated['operator_note'] ?? null,
                    'status' => IntakeDerivationStatus::Pending,
                ],
            );
        }

        $intakeRequest->update([
            'status' => IntakeRequestStatus::Routed,
        ]);

        $intakeRequest->histories()->create([
            'user_id' => $request->user()?->id,
            'from_status' => $previousStatus,
            'to_status' => IntakeRequestStatus::Routed,
            'action' => 'derived',
            'internal_comment' => $validated['operator_note'] ?? null,
            'new_values' => [
                'assistance_type_ids' => $assistanceTypeIds->all(),
                'department_ids' => $targetDepartmentIds,
            ],
            'changed_at' => now(),
        ]);

        return back()->with('success', 'Solicitud derivada.');
    }

    public function updateStatus(UpdateIntakeRequestStatusRequest $request, IntakeRequest $intakeRequest): RedirectResponse
    {
        $validated = $request->validated();
        $previousStatus = $intakeRequest->status;
        $nextStatus = IntakeRequestStatus::from($validated['status']);

        $intakeRequest->update([
            'status' => $nextStatus,
            'area' => $validated['area'] ?? $intakeRequest->area,
            'finished_at' => in_array($nextStatus, [IntakeRequestStatus::Finished, IntakeRequestStatus::Rejected], true) ? now() : $intakeRequest->finished_at,
        ]);

        $intakeRequest->histories()->create([
            'user_id' => $request->user()?->id,
            'from_status' => $previousStatus,
            'to_status' => $nextStatus,
            'action' => 'status_changed',
            'public_comment' => $validated['public_comment'] ?? null,
            'internal_comment' => $validated['internal_comment'] ?? null,
            'new_values' => ['area' => $validated['area'] ?? null],
            'changed_at' => now(),
        ]);

        return back()->with('success', 'Solicitud actualizada.');
    }

    /**
     * @return array<string, mixed>
     */
    private function derivationPayload(IntakeDerivation $derivation): array
    {
        return [
            'id' => $derivation->id,
            'status' => $derivation->status->value,
            'status_label' => $derivation->status->label(),
            'operator_note' => $derivation->operator_note,
            'department_response' => $derivation->department_response,
            'created_at' => $derivation->created_at?->format('d/m/Y H:i'),
            'updated_at' => $derivation->updated_at?->format('d/m/Y H:i'),
            'department' => $derivation->department,
            'assistance_type' => $derivation->assistanceType,
            'last_updater' => $derivation->lastUpdater,
        ];
    }
}
