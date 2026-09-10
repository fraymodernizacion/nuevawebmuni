<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintStatus;
use App\Enums\WorkRouteStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkRouteRequest;
use App\Models\Complaint;
use App\Models\Crew;
use App\Models\OperationalZone;
use App\Models\WorkRoute;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RoutePlanningController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(config('complaints.route_planning_enabled'), 404);

        Gate::authorize('viewAny', Complaint::class);

        $zoneId = $request->integer('zone');
        $includeResolved = $request->boolean('resolved');

        $zones = OperationalZone::with('localities:id,operational_zone_id,name')
            ->withCount(['complaints as pending_count' => fn ($query) => $query->whereIn('current_status', ComplaintStatus::pendingValues())])
            ->orderBy('code')
            ->get();

        $complaints = Complaint::query()
            ->with(['type:id,name', 'locality:id,name', 'operationalZone:id,code,name,color', 'assignedCrew:id,name,code'])
            ->when($zoneId, fn ($query) => $query->where('operational_zone_id', $zoneId))
            ->when(! $includeResolved, fn ($query) => $query->whereIn('current_status', ComplaintStatus::pendingValues()))
            ->orderBy('locality_id')
            ->orderBy('priority')
            ->oldest()
            ->get();

        return Inertia::render('complaints/admin/planning', [
            'zones' => $zones,
            'selectedZoneId' => $zoneId,
            'includeResolved' => $includeResolved,
            'complaints' => $complaints,
            'crews' => Crew::where('active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'canCreateRoutes' => $request->user()?->canCoordinateCrews() ?? false,
            'canManageComplaints' => $request->user()?->canUseComplaintManagement() ?? false,
            'userPrimaryCrewId' => $request->user()?->primary_crew_id,
            'workRoutes' => WorkRoute::with(['operationalZone:id,code,name,color', 'crew:id,code,name'])
                ->latest('date')
                ->limit(10)
                ->get(),
        ]);
    }

    public function store(StoreWorkRouteRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request): void {
            $workRoute = WorkRoute::create([
                'date' => $validated['date'],
                'operational_zone_id' => $validated['operational_zone_id'],
                'crew_id' => $validated['crew_id'],
                'created_by' => $request->user()->id,
                'status' => WorkRouteStatus::Planned,
                'notes' => $validated['notes'] ?? null,
            ]);

            $sync = collect($validated['complaint_ids'])
                ->values()
                ->mapWithKeys(fn (int $complaintId, int $index): array => [
                    $complaintId => [
                        'route_order' => $index + 1,
                        'added_at' => now(),
                    ],
                ])
                ->all();

            $workRoute->complaints()->sync($sync);

            Complaint::whereKey($validated['complaint_ids'])->update([
                'assigned_crew_id' => $validated['crew_id'],
                'current_status' => ComplaintStatus::Assigned,
            ]);
        });

        return back();
    }
}
