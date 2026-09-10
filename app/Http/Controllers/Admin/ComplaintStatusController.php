<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateComplaintStatusRequest;
use App\Jobs\SendWhatsAppComplaintNotification;
use App\Models\Complaint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ComplaintStatusController extends Controller
{
    public function update(UpdateComplaintStatusRequest $request, Complaint $complaint): RedirectResponse
    {
        $validated = $request->validated();
        $newStatus = ComplaintStatus::from($validated['status']);
        $oldStatus = $complaint->current_status;

        DB::transaction(function () use ($complaint, $validated, $newStatus, $oldStatus): void {
            $complaint->update([
                'current_status' => $newStatus,
                'priority' => $validated['priority'] ?? $complaint->priority,
                'location_needs_verification' => $validated['location_needs_verification'] ?? $complaint->location_needs_verification,
                'resolved_at' => $newStatus === ComplaintStatus::Resolved ? now() : $complaint->resolved_at,
                'closed_at' => $newStatus === ComplaintStatus::Closed ? now() : $complaint->closed_at,
            ]);

            $complaint->statusHistories()->create([
                'user_id' => auth()->id(),
                'from_status' => $oldStatus,
                'to_status' => $newStatus,
                'action' => 'status_changed',
                'observation' => $validated['observation'] ?? null,
                'old_values' => [
                    'status' => $oldStatus->value,
                    'priority' => $complaint->getOriginal('priority'),
                ],
                'new_values' => [
                    'status' => $newStatus->value,
                    'priority' => $complaint->priority->value,
                ],
                'changed_at' => now(),
            ]);

            if ($validated['send_whatsapp'] ?? false) {
                SendWhatsAppComplaintNotification::dispatch($complaint->id, $newStatus->value, [
                    'observation' => $validated['observation'] ?? null,
                    'changed_by' => auth()->user()?->name,
                ])->afterCommit();
            }
        });

        return back();
    }
}
