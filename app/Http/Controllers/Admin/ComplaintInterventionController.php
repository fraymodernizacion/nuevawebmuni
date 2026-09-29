<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintPhotoType;
use App\Enums\ComplaintStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComplaintInterventionRequest;
use App\Jobs\SendWhatsAppComplaintNotification;
use App\Models\Complaint;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Services\Complaints\ComplaintPhotoStorage;
use App\Services\Inventory\PendingInventoryWithdrawals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class ComplaintInterventionController extends Controller
{
    public function store(StoreComplaintInterventionRequest $request, Complaint $complaint, ComplaintPhotoStorage $photoStorage, PendingInventoryWithdrawals $pendingWithdrawals): RedirectResponse
    {
        $validated = $request->validated();
        $status = ComplaintStatus::from($validated['status']);
        $materials = collect($validated['materials'] ?? [])
            ->filter(fn (array $material): bool => filled($material['inventory_item_id'] ?? null))
            ->groupBy(fn (array $material): int => (int) $material['inventory_item_id'])
            ->map(fn ($group, int $inventoryItemId): array => [
                'inventory_item_id' => $inventoryItemId,
                'quantity' => round($group->sum(fn (array $material): float => (float) $material['quantity']), 2),
            ])
            ->values();

        DB::transaction(function () use ($complaint, $validated, $status, $request, $photoStorage, $materials, $pendingWithdrawals): void {
            $materialItems = collect();
            $materialAllocations = collect();

            if ($materials->isNotEmpty()) {
                $materialItems = InventoryItem::query()
                    ->whereKey($materials->pluck('inventory_item_id'))
                    ->get()
                    ->keyBy('id');

                foreach ($materials as $material) {
                    $inventoryItem = $materialItems->get($material['inventory_item_id']);

                    if (! $inventoryItem) {
                        throw ValidationException::withMessages([
                            'materials' => 'Uno de los insumos seleccionados ya no existe.',
                        ]);
                    }

                    $allocations = $pendingWithdrawals->allocateForComplaint($inventoryItem, $material['quantity'], $complaint, $request->user());

                    if ($allocations->isEmpty()) {
                        throw ValidationException::withMessages([
                            'materials' => "No hay material retirado pendiente suficiente para {$inventoryItem->name}.",
                        ]);
                    }

                    $materialAllocations->put($inventoryItem->id, $allocations);
                }
            }

            $intervention = $complaint->interventions()->create([
                'crew_id' => $complaint->assigned_crew_id,
                'user_id' => $request->user()->id,
                'status' => $status,
                'response_code' => $validated['response_code'] ?? null,
                'citizen_message' => $validated['citizen_message'] ?? null,
                'observations' => $validated['observations'] ?? null,
                'internal_supplies_notes' => $validated['internal_supplies_notes'] ?? null,
                'second_visit_reason' => $validated['second_visit_reason'] ?? null,
                'suggested_second_visit_date' => $validated['suggested_second_visit_date'] ?? null,
                'performed_at' => now(),
            ]);

            foreach ($materials as $material) {
                $inventoryItem = $materialItems->get($material['inventory_item_id']);
                $stockBefore = round((float) $inventoryItem->current_stock, 2);
                $allocations = $materialAllocations->get($inventoryItem->id, collect());

                $intervention->materials()->create([
                    'inventory_item_id' => $inventoryItem->id,
                    'inventory_item_code' => $inventoryItem->code,
                    'inventory_item_name' => $inventoryItem->name,
                    'inventory_item_unit' => $inventoryItem->unit,
                    'description' => $inventoryItem->name,
                    'quantity' => $material['quantity'],
                    'unit' => $inventoryItem->unit,
                ]);

                foreach ($allocations as $allocation) {
                    InventoryMovement::create([
                        'inventory_item_id' => $inventoryItem->id,
                        'complaint_intervention_id' => $intervention->id,
                        'user_id' => $request->user()->id,
                        'movement_type' => 'complaint_consumption',
                        'quantity' => $allocation['quantity'],
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockBefore,
                        'description' => "Consumo en reclamo {$complaint->public_code}",
                        'metadata' => [
                            'complaint_id' => $complaint->id,
                            'complaint_public_code' => $complaint->public_code,
                            'withdrawal_movement_id' => $allocation['movement']->id,
                            'source' => 'complaint_intervention',
                        ],
                    ]);
                }
            }

            $oldStatus = $complaint->current_status;
            $complaint->update([
                'current_status' => $status,
                'resolved_at' => $status === ComplaintStatus::Resolved ? now() : $complaint->resolved_at,
            ]);

            $storedPhotos = collect();

            foreach ($request->file('photos', []) as $photo) {
                $storedPhotos->push($photoStorage->store(
                    $complaint,
                    $photo,
                    ComplaintPhotoType::from($validated['photo_type'] ?? ($status === ComplaintStatus::Resolved ? ComplaintPhotoType::Resolution->value : ComplaintPhotoType::Intervention->value)),
                    $request->user()->id,
                ));
            }

            $complaint->statusHistories()->create([
                'user_id' => $request->user()->id,
                'from_status' => $oldStatus,
                'to_status' => $status,
                'action' => 'intervention',
                'observation' => $validated['citizen_message'] ?? null,
                'new_values' => [
                    'response_code' => $validated['response_code'] ?? null,
                    'citizen_message' => $validated['citizen_message'] ?? null,
                    'internal_observation' => $validated['observations'] ?? null,
                    'internal_supplies_notes' => $validated['internal_supplies_notes'] ?? null,
                    'photos_count' => count($request->file('photos', [])),
                    'materials_count' => $materials->count(),
                ],
                'changed_at' => now(),
            ]);

            if ($validated['send_whatsapp'] ?? false) {
                $notificationPhoto = $storedPhotos
                    ->first(fn ($photo): bool => $photo->type === ComplaintPhotoType::Resolution);
                $notificationPhoto ??= $storedPhotos->first();

                SendWhatsAppComplaintNotification::dispatch($complaint->id, $status->value, [
                    'observation' => $validated['citizen_message'] ?? null,
                    'changed_by' => $request->user()->name,
                    'intervention_photo_url' => $notificationPhoto ? URL::to($notificationPhoto->url()) : null,
                ])->afterCommit();
            }
        });

        return back();
    }
}
