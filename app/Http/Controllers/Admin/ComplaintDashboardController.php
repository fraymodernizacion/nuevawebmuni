<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintPriority;
use App\Enums\ComplaintStatus;
use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use App\Models\Locality;
use App\Models\OperationalZone;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ComplaintDashboardController extends Controller
{
    public function __invoke(): Response
    {
        Gate::authorize('viewAny', Complaint::class);

        $user = request()->user();
        $canManageComplaints = $user?->canUseComplaintManagement() ?? false;

        $total = Complaint::count();
        $resolved = Complaint::where('current_status', ComplaintStatus::Resolved)->count();
        $pendingValues = ComplaintStatus::pendingValues();
        $olderThanSevenDays = today()->subDays(7);

        return Inertia::render('complaints/admin/dashboard', [
            'kpis' => [
                'today' => Complaint::whereDate('created_at', today())->count(),
                'open' => Complaint::whereIn('current_status', $pendingValues)->count(),
                'in_progress' => Complaint::where('current_status', ComplaintStatus::InProgress)->count(),
                'second_visit' => Complaint::where('current_status', ComplaintStatus::NeedsSecondVisit)->count(),
                'urgent' => Complaint::where('priority', ComplaintPriority::Urgent)->whereIn('current_status', $pendingValues)->count(),
                'older_than_seven_days' => Complaint::whereIn('current_status', $pendingValues)->whereDate('created_at', '<=', $olderThanSevenDays)->count(),
                'resolved' => $resolved,
                'resolution_rate' => $total > 0 ? round(($resolved / $total) * 100, 1) : 0,
            ],
            'byZone' => OperationalZone::with('localities:id,operational_zone_id,name')
                ->withCount([
                    'complaints as open_count' => fn ($query) => $query->whereIn('current_status', $pendingValues),
                    'complaints as resolved_count' => fn ($query) => $query->where('current_status', ComplaintStatus::Resolved),
                    'complaints as second_visit_count' => fn ($query) => $query->where('current_status', ComplaintStatus::NeedsSecondVisit),
                ])
                ->orderBy('code')
                ->get(),
            'byStatus' => Complaint::query()
                ->selectRaw('current_status, count(*) as total')
                ->groupBy('current_status')
                ->orderBy('current_status')
                ->get(),
            'modules' => [
                'active' => ComplaintCategory::query()
                    ->select(['id', 'slug', 'name', 'active'])
                    ->withCount([
                        'types as type_count' => fn ($query) => $query->where('active', true),
                        'complaints as total_count',
                        'complaints as open_count' => fn ($query) => $query->whereIn('current_status', $pendingValues),
                        'complaints as resolved_count' => fn ($query) => $query->where('current_status', ComplaintStatus::Resolved),
                    ])
                    ->where('active', true)
                    ->orderBy('name')
                    ->get()
                    ->map(fn (ComplaintCategory $category): array => [
                        'id' => $category->id,
                        'slug' => $category->slug,
                        'name' => $category->name,
                        'status' => $category->slug === 'alumbrado-publico' ? 'Activo' : 'Preparado',
                        'type_count' => $category->type_count,
                        'total_count' => $category->total_count,
                        'open_count' => $category->open_count,
                        'resolved_count' => $category->resolved_count,
                        'enabled' => $category->slug === 'alumbrado-publico',
                    ]),
                'standby' => [
                    ['name' => 'Calles y bacheo', 'description' => 'Reclamos por calzada, banquinas, badenes y mantenimiento vial.'],
                    ['name' => 'Residuos y limpieza', 'description' => 'Recoleccion, microbasurales, contenedores y limpieza urbana.'],
                    ['name' => 'Arbolado urbano', 'description' => 'Poda, extraccion, ramas en riesgo y obstrucciones.'],
                    ['name' => 'Transito y senalizacion', 'description' => 'Carteleria, reductores, semaforos y seguridad vial.'],
                    ['name' => 'Espacios publicos', 'description' => 'Plazas, juegos, mobiliario urbano y mantenimiento general.'],
                ],
            ],
            'canManageComplaints' => $canManageComplaints,
            'routePlanningEnabled' => (bool) config('complaints.route_planning_enabled'),
            'analytics' => [
                'byLocality' => Locality::query()
                    ->select(['id', 'name', 'operational_zone_id'])
                    ->with('operationalZone:id,code,color')
                    ->withCount([
                        'complaints as total_count',
                        'complaints as open_count' => fn ($query) => $query->whereIn('current_status', $pendingValues),
                        'complaints as urgent_count' => fn ($query) => $query->where('priority', ComplaintPriority::Urgent)->whereIn('current_status', $pendingValues),
                    ])
                    ->orderByDesc('open_count')
                    ->orderBy('name')
                    ->get(),
                'byType' => ComplaintType::query()
                    ->select(['id', 'name'])
                    ->withCount([
                        'complaints as total_count',
                        'complaints as open_count' => fn ($query) => $query->whereIn('current_status', $pendingValues),
                    ])
                    ->orderByDesc('open_count')
                    ->orderBy('name')
                    ->get(),
                'byPriority' => Complaint::query()
                    ->selectRaw('priority, count(*) as total')
                    ->whereIn('current_status', $pendingValues)
                    ->groupBy('priority')
                    ->orderByDesc('total')
                    ->get(),
                'aging' => [
                    ['label' => '0 a 2 dias', 'total' => Complaint::whereIn('current_status', $pendingValues)->whereDate('created_at', '>=', today()->subDays(2))->count()],
                    ['label' => '3 a 7 dias', 'total' => Complaint::whereIn('current_status', $pendingValues)->whereDate('created_at', '<', today()->subDays(2))->whereDate('created_at', '>', $olderThanSevenDays)->count()],
                    ['label' => 'Mas de 7 dias', 'total' => Complaint::whereIn('current_status', $pendingValues)->whereDate('created_at', '<=', $olderThanSevenDays)->count()],
                ],
                'trend' => collect(range(6, 0))->map(function (int $daysAgo): array {
                    $date = today()->subDays($daysAgo);

                    return [
                        'label' => $date->format('d/m'),
                        'total' => Complaint::whereDate('created_at', $date)->count(),
                    ];
                })->values(),
            ],
        ]);
    }
}
