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
use App\Models\IntakeDerivationHistory;
use App\Models\IntakeRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class IntakeRequestController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canUseIntakeManagement(), 403);

        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();
        $secretariat = $request->string('secretariat')->toString();

        return Inertia::render('intake/admin/index', [
            'filters' => $request->only(['search', 'status', 'secretariat']),
            'statuses' => IntakeRequestStatus::options(),
            'requests' => IntakeRequest::with('type:id,name,category,color')
                ->when($status, fn ($query) => $query->where('status', $status))
                ->when($secretariat, fn ($query) => $query->whereHas(
                    'derivations.department',
                    fn ($query) => $query->where('secretariat', $secretariat),
                ))
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
            'secretariatOptions' => $this->secretariatOptions(),
            'unreadDerivationNotificationsCount' => $this->notificationQuery($secretariat)
                ->whereNull('operator_seen_at')
                ->count(),
            'derivationNotifications' => $this->notificationQuery($secretariat)
                ->whereNull('operator_seen_at')
                ->latest('changed_at')
                ->limit(8)
                ->get()
                ->map(fn (IntakeDerivationHistory $history): array => $this->derivationNotificationPayload($history)),
        ]);
    }

    public function notifications(Request $request): Response
    {
        abort_unless($request->user()?->canUseIntakeManagement(), 403);

        $secretariat = $request->string('secretariat')->toString();
        $readState = $request->string('read_state', 'unread')->toString();

        return Inertia::render('intake/admin/notifications', [
            'filters' => [
                'secretariat' => $secretariat,
                'read_state' => $readState,
            ],
            'secretariatOptions' => $this->secretariatOptions(),
            'unreadCount' => $this->notificationQuery($secretariat)
                ->whereNull('operator_seen_at')
                ->count(),
            'notifications' => $this->notificationQuery($secretariat)
                ->when($readState === 'unread', fn (Builder $query) => $query->whereNull('operator_seen_at'))
                ->when($readState === 'read', fn (Builder $query) => $query->whereNotNull('operator_seen_at'))
                ->latest('changed_at')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (IntakeDerivationHistory $history): array => $this->derivationNotificationPayload($history)),
        ]);
    }

    public function markNotificationsAsRead(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->canUseIntakeManagement(), 403);

        $secretariat = $request->string('secretariat')->toString();
        $readState = $request->string('read_state', 'unread')->toString();

        $this->notificationQuery($secretariat)
            ->when($readState === 'read', fn (Builder $query) => $query->whereNotNull('operator_seen_at'))
            ->when($readState !== 'read', fn (Builder $query) => $query->whereNull('operator_seen_at'))
            ->update(['operator_seen_at' => now()]);

        return back()->with('success', 'Notificaciones marcadas como leidas.');
    }

    public function markNotificationAsRead(Request $request, IntakeDerivationHistory $intakeDerivationHistory): RedirectResponse
    {
        abort_unless($request->user()?->canUseIntakeManagement(), 403);

        $intakeDerivationHistory->update([
            'operator_seen_at' => now(),
        ]);

        return back()->with('success', 'Notificacion marcada como leida.');
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
            'derivations.histories.user:id,name',
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
            'histories' => $derivation->histories
                ->sortByDesc('changed_at')
                ->map(fn (IntakeDerivationHistory $history): array => [
                    'id' => $history->id,
                    'action' => $history->action,
                    'from_status' => $history->from_status?->value,
                    'to_status' => $history->to_status?->value,
                    'from_status_label' => $history->from_status?->label(),
                    'to_status_label' => $history->to_status?->label(),
                    'previous_response' => $history->previous_response,
                    'new_response' => $history->new_response,
                    'changed_at' => $history->changed_at?->toJSON(),
                    'user' => $history->user ? ['name' => $history->user->name] : null,
                ])
                ->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function derivationNotificationPayload(IntakeDerivationHistory $history): array
    {
        $derivation = $history->derivation;

        return [
            'id' => $history->id,
            'action' => $history->action,
            'from_status_label' => $history->from_status?->label(),
            'to_status_label' => $history->to_status?->label(),
            'previous_response' => $history->previous_response,
            'new_response' => $history->new_response,
            'changed_at' => $history->changed_at?->toJSON(),
            'operator_seen_at' => $history->operator_seen_at?->toJSON(),
            'is_seen' => $history->operator_seen_at !== null,
            'user' => $history->user ? ['name' => $history->user->name] : null,
            'department' => $derivation?->department ? [
                'name' => $derivation->department->name,
                'secretariat' => $derivation->department->secretariat,
                'color' => $derivation->department->color,
            ] : null,
            'assistance_type' => $derivation?->assistanceType ? [
                'name' => $derivation->assistanceType->name,
                'color' => $derivation->assistanceType->color,
            ] : null,
            'request' => $derivation?->request ? [
                'id' => $derivation->request->id,
                'public_code' => $derivation->request->public_code,
                'subject' => $derivation->request->subject,
                'applicant_name' => $derivation->request->applicant_name,
            ] : null,
        ];
    }

    private function notificationQuery(?string $secretariat = null): Builder
    {
        return IntakeDerivationHistory::query()
            ->with([
                'derivation.department:id,name,secretariat,color',
                'derivation.assistanceType:id,name,color',
                'derivation.request:id,public_code,subject,applicant_name',
                'user:id,name',
            ])
            ->when($secretariat, fn (Builder $query) => $query->whereHas(
                'derivation.department',
                fn (Builder $query) => $query->where('secretariat', $secretariat),
            ));
    }

    /**
     * @return Collection<int, string>
     */
    private function secretariatOptions(): Collection
    {
        return IntakeDepartment::query()
            ->where('active', true)
            ->whereNotNull('secretariat')
            ->distinct()
            ->orderBy('secretariat')
            ->pluck('secretariat')
            ->filter()
            ->values();
    }
}
