<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignComplaintRequest;
use App\Http\Requests\BulkAssignComplaintsRequest;
use App\Jobs\SendWhatsAppComplaintNotification;
use App\Models\Complaint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ComplaintAssignmentController extends Controller
{
    public function store(AssignComplaintRequest $request, Complaint $complaint): RedirectResponse
    {
        $this->assign(
            $complaint,
            (int) $request->validated('crew_id'),
            $request->validated('notes'),
            (bool) $request->validated('send_whatsapp', false),
        );

        return back();
    }

    public function bulk(BulkAssignComplaintsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            Complaint::whereKey($validated['complaint_ids'])
                ->get()
                ->each(fn (Complaint $complaint) => $this->assign($complaint, (int) $validated['crew_id'], $validated['notes'] ?? null));
        });

        return back();
    }

    private function assign(Complaint $complaint, int $crewId, ?string $notes, bool $sendWhatsApp = false): void
    {
        DB::transaction(function () use ($complaint, $crewId, $notes, $sendWhatsApp): void {
            $previousCrewId = $complaint->assigned_crew_id;
            $previousStatus = $complaint->current_status;

            $complaint->update([
                'assigned_crew_id' => $crewId,
                'current_status' => ComplaintStatus::Assigned,
            ]);

            $complaint->assignments()->create([
                'crew_id' => $crewId,
                'assigned_by' => auth()->id(),
                'notes' => $notes,
                'assigned_at' => now(),
            ]);

            $complaint->statusHistories()->create([
                'user_id' => auth()->id(),
                'from_status' => $previousStatus,
                'to_status' => ComplaintStatus::Assigned,
                'action' => $previousCrewId ? 'reassigned' : 'assigned',
                'observation' => $notes,
                'old_values' => ['assigned_crew_id' => $previousCrewId],
                'new_values' => ['assigned_crew_id' => $crewId],
                'changed_at' => now(),
            ]);

            if ($sendWhatsApp) {
                SendWhatsAppComplaintNotification::dispatch($complaint->id, ComplaintStatus::Assigned->value, [
                    'observation' => $notes,
                    'changed_by' => auth()->user()?->name,
                ])->afterCommit();
            }
        });
    }
}
