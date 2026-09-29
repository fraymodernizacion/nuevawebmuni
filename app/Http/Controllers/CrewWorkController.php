<?php

namespace App\Http\Controllers;

use App\Enums\ComplaintStatus;
use App\Enums\WorkRouteStatus;
use App\Models\Complaint;
use App\Models\InventoryItem;
use App\Models\OperationalZone;
use App\Models\WorkRoute;
use App\Services\Inventory\PendingInventoryWithdrawals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CrewWorkController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $zoneId = $request->integer('zone');
        $statusFilter = $request->query('status', 'pending');
        if (! in_array($statusFilter, ['pending', 'in_progress', 'resolved_today'], true)) {
            $statusFilter = 'pending';
        }
        $routePlanningEnabled = (bool) config('complaints.route_planning_enabled');
        $canManageComplaintOperations = $user->canUseComplaintManagement();

        abort_unless($user->canUseCrewWork(), 403);

        $complaints = Complaint::with(['type:id,name', 'locality:id,name', 'operationalZone:id,code,name,color'])
            ->when(! $canManageComplaintOperations, fn ($query) => $query->where('assigned_crew_id', $user->primary_crew_id))
            ->when($statusFilter === 'pending', fn ($query) => $query->whereIn('current_status', ComplaintStatus::pendingValues()))
            ->when($statusFilter === 'in_progress', fn ($query) => $query->where('current_status', ComplaintStatus::InProgress))
            ->when($statusFilter === 'resolved_today', fn ($query) => $query->where('current_status', ComplaintStatus::Resolved)->whereDate('resolved_at', today()))
            ->when($zoneId, fn ($query) => $query->where('operational_zone_id', $zoneId))
            ->oldest()
            ->get();

        $pendingMapComplaints = Complaint::with(['type:id,name', 'locality:id,name', 'operationalZone:id,code,name,color'])
            ->when(! $canManageComplaintOperations, fn ($query) => $query->where('assigned_crew_id', $user->primary_crew_id))
            ->when($statusFilter === 'pending', fn ($query) => $query->whereIn('current_status', ComplaintStatus::pendingValues()))
            ->when($statusFilter === 'in_progress', fn ($query) => $query->where('current_status', ComplaintStatus::InProgress))
            ->when($statusFilter === 'resolved_today', fn ($query) => $query->where('current_status', ComplaintStatus::Resolved)->whereDate('resolved_at', today()))
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->when($zoneId, fn ($query) => $query->where('operational_zone_id', $zoneId))
            ->latest()
            ->get()
            ->map(fn (Complaint $complaint): array => [
                'id' => $complaint->id,
                'public_code' => $complaint->public_code,
                'current_status' => $complaint->current_status,
                'created_at' => $complaint->created_at,
                'priority' => $complaint->priority,
                'latitude' => $complaint->latitude,
                'longitude' => $complaint->longitude,
                'location_reference' => $complaint->location_reference,
                'street' => $complaint->street,
                'assigned_crew_id' => $complaint->assigned_crew_id,
                'can_open' => $canManageComplaintOperations || $complaint->assigned_crew_id === $user->primary_crew_id,
                'type' => $complaint->type,
                'locality' => $complaint->locality,
                'operational_zone' => $complaint->operationalZone,
            ]);
        $baseAssignedQuery = Complaint::query()
            ->when(! $canManageComplaintOperations, fn ($query) => $query->where('assigned_crew_id', $user->primary_crew_id));

        return Inertia::render('complaints/crew/index', [
            'zones' => OperationalZone::with('localities:id,operational_zone_id,name')
                ->withCount([
                    'complaints as assigned_pending_count' => fn ($query) => $query
                        ->when(! $canManageComplaintOperations, fn ($query) => $query->where('assigned_crew_id', $user->primary_crew_id))
                        ->whereIn('current_status', ComplaintStatus::pendingValues()),
                    'complaints as total_pending_count' => fn ($query) => $query
                        ->whereIn('current_status', ComplaintStatus::pendingValues()),
                ])
                ->orderBy('code')
                ->get(),
            'summary' => [
                'pending' => (clone $baseAssignedQuery)
                    ->whereIn('current_status', ComplaintStatus::pendingValues())
                    ->count(),
                'in_progress' => (clone $baseAssignedQuery)
                    ->where('current_status', ComplaintStatus::InProgress)
                    ->count(),
                'resolved_today' => (clone $baseAssignedQuery)
                    ->where('current_status', ComplaintStatus::Resolved)
                    ->whereDate('resolved_at', today())
                    ->count(),
            ],
            'selectedZoneId' => $zoneId,
            'selectedStatus' => $statusFilter,
            'complaints' => $complaints,
            'pendingMapComplaints' => $pendingMapComplaints,
            'routePlanningEnabled' => $routePlanningEnabled,
            'canManageComplaintOperations' => $canManageComplaintOperations,
            'todayRoute' => $routePlanningEnabled
                ? WorkRoute::with(['operationalZone:id,code,name,color', 'crew:id,name,code', 'complaints.type:id,name', 'complaints.locality:id,name'])
                    ->where('crew_id', $user->primary_crew_id)
                    ->whereDate('date', today())
                    ->when($zoneId, fn ($query) => $query->where('operational_zone_id', $zoneId))
                    ->latest()
                    ->first()
                : null,
        ]);
    }

    public function show(Complaint $complaint, PendingInventoryWithdrawals $pendingWithdrawals): Response
    {
        abort_unless(request()->user()->canUseCrewWork(), 403);

        Gate::authorize('view', $complaint);

        $complaint->load([
            'type:id,name',
            'locality:id,name',
            'operationalZone:id,code,name,color',
            'photos',
            'interventions.user:id,name',
            'interventions.materials',
            'statusHistories.user:id,name',
        ]);

        $pendingInventoryItems = $pendingWithdrawals
            ->forComplaint($complaint, request()->user())
            ->keyBy(fn (array $pendingItem): int => $pendingItem['inventory_item']->id);

        return Inertia::render('complaints/crew/show', [
            'inventoryItems' => InventoryItem::query()
                ->where('active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'unit', 'current_stock', 'minimum_stock'])
                ->map(function (InventoryItem $inventoryItem) use ($pendingInventoryItems): array {
                    $pendingItem = $pendingInventoryItems->get($inventoryItem->id);

                    return [
                        'id' => $inventoryItem->id,
                        'code' => $inventoryItem->code,
                        'name' => $inventoryItem->name,
                        'unit' => $inventoryItem->unit,
                        'current_stock' => (float) $inventoryItem->current_stock,
                        'minimum_stock' => (float) $inventoryItem->minimum_stock,
                        'withdrawn_quantity' => $pendingItem['withdrawn_quantity'] ?? 0,
                        'used_quantity' => $pendingItem['used_quantity'] ?? 0,
                        'returned_quantity' => $pendingItem['returned_quantity'] ?? 0,
                        'pending_quantity' => $pendingItem['pending_quantity'] ?? 0,
                    ];
                }),
            'complaint' => [
                ...$complaint->toArray(),
                'photos' => $complaint->photos->map(fn ($photo): array => [
                    'id' => $photo->id,
                    'type' => $photo->type->value,
                    'type_label' => $photo->type->label(),
                    'url' => $photo->url(),
                    'original_name' => $photo->original_name,
                    'taken_at' => $photo->taken_at?->format('d/m/Y H:i'),
                ])->values(),
                'history' => $complaint->statusHistories->map(fn ($history): array => [
                    'id' => $history->id,
                    'action' => $history->action,
                    'from_status' => $history->from_status?->value,
                    'to_status' => $history->to_status?->value,
                    'observation' => $history->observation,
                    'new_values' => $history->new_values,
                    'user' => $history->user?->only(['id', 'name']),
                    'changed_at' => $history->changed_at?->format('d/m/Y H:i'),
                ])->values(),
            ],
            'canIntervene' => Gate::allows('intervene', $complaint),
            'responseOptions' => config('complaint_responses.crew', []),
        ]);
    }

    public function finish(WorkRoute $workRoute): RedirectResponse
    {
        abort_unless(config('complaints.route_planning_enabled'), 404);

        $user = request()->user();

        abort_unless(
            $user->canUseCrewWork()
                && $user->primary_crew_id !== null
                && $workRoute->crew_id === $user->primary_crew_id,
            403,
        );

        if ($workRoute->status !== WorkRouteStatus::Finished) {
            $workRoute->update([
                'status' => WorkRouteStatus::Finished,
                'started_at' => $workRoute->started_at ?? now(),
                'finished_at' => now(),
            ]);
        }

        return back();
    }
}
