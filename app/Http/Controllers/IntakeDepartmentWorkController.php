<?php

namespace App\Http\Controllers;

use App\Enums\IntakeDerivationStatus;
use App\Http\Requests\UpdateIntakeDerivationRequest;
use App\Models\IntakeDerivation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntakeDepartmentWorkController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canUseIntakeDepartmentPanel(), 403);

        $departmentId = $request->user()?->intake_department_id;
        $canViewAllDepartments = $request->user()?->isSuperAdmin() || $request->user()?->role === 'admin';
        abort_unless($departmentId || $canViewAllDepartments, 403);

        return Inertia::render('intake/department/index', [
            'department' => $request->user()?->intakeDepartment,
            'derivations' => IntakeDerivation::query()
                ->with([
                    'department:id,name,color',
                    'assistanceType:id,name,color',
                    'request:id,public_code,subject,summary,applicant_name,applicant_phone,created_at',
                ])
                ->when(! $canViewAllDepartments, fn ($query) => $query->where('intake_department_id', $departmentId))
                ->latest()
                ->paginate(15)
                ->withQueryString(),
        ]);
    }

    public function show(Request $request, IntakeDerivation $intakeDerivation): Response
    {
        abort_unless($request->user()?->canUseIntakeDepartmentPanel(), 403);
        abort_unless($this->canAccessDerivation($request, $intakeDerivation), 403);

        $intakeDerivation->load([
            'department:id,name,color',
            'assistanceType:id,name,color',
            'request.type',
            'request.attachments',
            'request.histories.user:id,name',
        ]);

        return Inertia::render('intake/department/show', [
            'derivation' => [
                'id' => $intakeDerivation->id,
                'status' => $intakeDerivation->status->value,
                'status_label' => $intakeDerivation->status->label(),
                'operator_note' => $intakeDerivation->operator_note,
                'department_response' => $intakeDerivation->department_response,
                'created_at' => $intakeDerivation->created_at?->format('d/m/Y H:i'),
                'updated_at' => $intakeDerivation->updated_at?->format('d/m/Y H:i'),
                'department' => $intakeDerivation->department,
                'assistance_type' => $intakeDerivation->assistanceType,
                'request' => [
                    ...$intakeDerivation->request->toArray(),
                    'status_label' => $intakeDerivation->request->status->label(),
                    'attachments' => $intakeDerivation->request->attachments->map(fn ($attachment): array => [
                        'id' => $attachment->id,
                        'original_name' => $attachment->original_name,
                        'url' => $attachment->url(),
                        'type' => $attachment->type,
                        'created_at' => $attachment->created_at?->format('d/m/Y H:i'),
                    ]),
                ],
            ],
            'statuses' => IntakeDerivationStatus::options(),
        ]);
    }

    public function update(UpdateIntakeDerivationRequest $request, IntakeDerivation $intakeDerivation): RedirectResponse
    {
        abort_unless($this->canAccessDerivation($request, $intakeDerivation), 403);

        $validated = $request->validated();
        $status = IntakeDerivationStatus::from($validated['status']);

        $intakeDerivation->update([
            'status' => $status,
            'department_response' => $validated['department_response'] ?? null,
            'last_updated_by' => $request->user()?->id,
            'accepted_at' => $status === IntakeDerivationStatus::Accepted ? now() : $intakeDerivation->accepted_at,
            'completed_at' => in_array($status, [IntakeDerivationStatus::Completed, IntakeDerivationStatus::NotApplicable], true) ? now() : $intakeDerivation->completed_at,
        ]);

        return back()->with('success', 'Derivacion actualizada.');
    }

    private function canAccessDerivation(Request $request, IntakeDerivation $intakeDerivation): bool
    {
        if ($request->user()?->isSuperAdmin() || $request->user()?->role === 'admin') {
            return true;
        }

        return $request->user()?->intake_department_id === $intakeDerivation->intake_department_id;
    }
}
