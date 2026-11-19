<?php

namespace App\Http\Controllers\Admin;

use App\Enums\IntakeRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\IntakeDashboardRequest;
use App\Models\IntakeDepartment;
use App\Models\IntakeRequest;
use App\Support\LocalDateTime;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class IntakeDashboardController extends Controller
{
    public function __invoke(IntakeDashboardRequest $request): Response
    {
        $filters = $request->validated();
        $currentYear = (int) LocalDateTime::today()->format('Y');
        $year = (int) ($filters['year'] ?? $currentYear);
        $month = isset($filters['month']) ? (int) $filters['month'] : null;
        $secretariat = $filters['secretariat'] ?? '';
        $yearStart = CarbonImmutable::create($year, 1, 1, 0, 0, 0, LocalDateTime::TIMEZONE);
        $start = $month ? $yearStart->month($month) : $yearStart;
        $end = $month ? $start->addMonth() : $start->addYear();
        $annual = IntakeRequest::query()
            ->where('intake_requests.created_at', '>=', $yearStart->utc())
            ->where('intake_requests.created_at', '<', $yearStart->addYear()->utc());

        if ($secretariat === '__unassigned') {
            $annual->whereDoesntHave('derivations.department', fn (Builder $query) => $query
                ->whereNotNull('secretariat')->where('secretariat', '!=', ''));
        } elseif ($secretariat !== '') {
            $annual->whereHas('derivations.department', fn (Builder $query) => $query->where('secretariat', $secretariat));
        }

        $period = (clone $annual)
            ->where('intake_requests.created_at', '>=', $start->utc())
            ->where('intake_requests.created_at', '<', $end->utc());
        $counts = (clone $period)->toBase()->select('status')->selectRaw('COUNT(*) as total')
            ->groupBy('status')->pluck('total', 'status');
        $total = (int) $counts->sum();
        $finished = (int) $counts->get(IntakeRequestStatus::Finished->value, 0);
        $rejected = (int) $counts->get(IntakeRequestStatus::Rejected->value, 0);
        $suspended = (int) $counts->get(IntakeRequestStatus::Suspended->value, 0);
        $states = collect(IntakeRequestStatus::options());
        if ($counts->get(IntakeRequestStatus::Answered->value, 0) > 0) {
            $states->push(['value' => 'answered', 'label' => 'Respondido (histórico)']);
        }

        $types = (clone $period)->toBase()
            ->join('intake_request_types as types', 'types.id', '=', 'intake_requests.intake_request_type_id')
            ->leftJoin('intake_request_subtypes as subtypes', 'subtypes.id', '=', 'intake_requests.intake_request_subtype_id')
            ->selectRaw('COALESCE(subtypes.name, types.name) as label, COUNT(*) as total')
            ->groupBy('types.id', 'types.name', 'subtypes.id', 'subtypes.name')
            ->orderByDesc('total')->orderBy('label')->limit(5)->get()
            ->map(fn (object $row): array => ['label' => $row->label, 'total' => (int) $row->total]);
        $otherTypes = $total - $types->sum('total');
        if ($otherTypes > 0) {
            $types->push(['label' => 'Otros trámites', 'total' => $otherTypes]);
        }

        $secretariats = DB::table('intake_derivations as derivations')
            ->join('intake_departments as departments', 'departments.id', '=', 'derivations.intake_department_id')
            ->whereIn('derivations.intake_request_id', (clone $period)->select('intake_requests.id'))
            ->whereNotNull('departments.secretariat')->where('departments.secretariat', '!=', '')
            ->when($secretariat !== '' && $secretariat !== '__unassigned', fn ($query) => $query->where('departments.secretariat', $secretariat))
            ->selectRaw('departments.secretariat as label, COUNT(DISTINCT derivations.intake_request_id) as total')
            ->groupBy('departments.secretariat')->orderByDesc('total')->orderBy('label')->get()
            ->map(fn (object $row): array => ['label' => $row->label, 'total' => (int) $row->total, 'value' => $row->label]);
        $unassigned = (clone $period)->whereDoesntHave('derivations.department', fn (Builder $query) => $query
            ->whereNotNull('secretariat')->where('secretariat', '!=', ''))->count();
        if ($unassigned > 0) {
            $secretariats->push(['label' => 'Sin secretaría asignada', 'total' => $unassigned, 'value' => '__unassigned']);
        }
        $secretariats = $secretariats->sortByDesc('total')->values();

        $monthlyQuery = (clone $annual)->toBase();
        for ($number = 1; $number <= 12; $number++) {
            $from = $yearStart->month($number);
            $monthlyQuery->selectRaw('COALESCE(SUM(CASE WHEN intake_requests.created_at >= ? AND intake_requests.created_at < ? THEN 1 ELSE 0 END), 0) as month_'.$number, [$from->utc(), $from->addMonth()->utc()]);
        }
        $monthlyCounts = $monthlyQuery->first();
        $bounds = IntakeRequest::query()->toBase()->selectRaw('MIN(created_at) as first_date, MAX(created_at) as last_date')->first();
        $firstYear = $bounds->first_date ? (int) CarbonImmutable::parse($bounds->first_date, 'UTC')->setTimezone(LocalDateTime::TIMEZONE)->year : $currentYear;
        $lastYear = $bounds->last_date ? (int) CarbonImmutable::parse($bounds->last_date, 'UTC')->setTimezone(LocalDateTime::TIMEZONE)->year : $currentYear;

        return Inertia::render('intake/admin/dashboard', [
            'filters' => ['year' => $year, 'month' => $month, 'secretariat' => $secretariat],
            'yearOptions' => range(max(2000, min($firstYear, $year, $currentYear)), min(2100, max($lastYear, $year, $currentYear))),
            'secretariatOptions' => IntakeDepartment::query()->whereNotNull('secretariat')->where('secretariat', '!=', '')
                ->distinct()->orderBy('secretariat')->pluck('secretariat'),
            'period' => ['from' => $start->format('d/m/Y'), 'to' => $end->subDay()->format('d/m/Y')],
            'summary' => [
                'total' => $total, 'finished' => $finished, 'in_progress' => $total - $finished - $rejected - $suspended,
                'rejected' => $rejected, 'suspended' => $suspended,
            ],
            'statuses' => $states->map(fn (array $status): array => [...$status, 'total' => (int) $counts->get($status['value'], 0)])->values(),
            'types' => $types,
            'secretariats' => $secretariats,
            'monthly' => collect(range(1, 12))->map(fn (int $number): array => ['month' => $number, 'total' => (int) $monthlyCounts->{'month_'.$number}]),
            'updatedAt' => LocalDateTime::format(now()),
        ]);
    }
}
