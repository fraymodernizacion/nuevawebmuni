<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ComplaintStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateComplaintNeighborRequest;
use App\Models\Complaint;
use App\Models\ComplaintType;
use App\Models\Crew;
use App\Models\Locality;
use App\Models\OperationalZone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ComplaintController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canUseComplaintManagement(), 403);

        $status = $request->string('status')->toString();
        $search = $request->string('search')->squish()->toString();
        $order = $request->string('order')->toString() === 'recent' ? 'recent' : 'oldest';
        $allowedStatuses = collect(ComplaintStatus::cases())
            ->map(fn (ComplaintStatus $status): string => $status->value)
            ->all();

        $complaints = Complaint::query()
            ->with(['type:id,name', 'category:id,name', 'locality:id,name', 'operationalZone:id,code,name,color'])
            ->when($search, fn (Builder $query) => $this->applySearch($query, $search))
            ->when(in_array($status, $allowedStatuses, true), fn ($query) => $query->where('current_status', $status))
            ->when($request->integer('zone'), fn ($query, int $zone) => $query->where('operational_zone_id', $zone))
            ->when($request->integer('locality'), fn ($query, int $locality) => $query->where('locality_id', $locality))
            ->when($request->integer('type'), fn ($query, int $type) => $query->where('complaint_type_id', $type))
            ->when($request->integer('crew'), fn ($query, int $crew) => $query->where('assigned_crew_id', $crew))
            ->when($request->string('priority')->toString(), fn ($query, string $priority) => $query->where('priority', $priority))
            ->when($search, fn (Builder $query) => $this->orderBySearchRelevance($query, $search))
            ->when(
                $order === 'recent',
                fn ($query) => $query->latest(),
                fn ($query) => $query->oldest(),
            )
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('complaints/admin/index', [
            'complaints' => $complaints,
            'filters' => [
                'search' => $search,
                'status' => in_array($status, $allowedStatuses, true) ? $status : '',
                'zone' => $request->string('zone')->toString(),
                'locality' => $request->string('locality')->toString(),
                'type' => $request->string('type')->toString(),
                'crew' => $request->string('crew')->toString(),
                'priority' => $request->string('priority')->toString(),
                'order' => $order,
            ],
            'operationalSummary' => [
                'new' => Complaint::where('current_status', ComplaintStatus::New)->count(),
                'assigned' => Complaint::where('current_status', ComplaintStatus::Assigned)->count(),
                'in_progress' => Complaint::where('current_status', ComplaintStatus::InProgress)->count(),
                'needs_second_visit' => Complaint::where('current_status', ComplaintStatus::NeedsSecondVisit)->count(),
            ],
            'options' => $this->options(),
        ]);
    }

    public function show(Complaint $complaint): Response
    {
        Gate::authorize('view', $complaint);
        abort_unless(request()->user()?->canUseComplaintManagement(), 403);

        $complaint->load([
            'category:id,name',
            'type:id,name',
            'locality:id,name',
            'operationalZone:id,code,name,color',
            'assignedCrew:id,name,code',
            'photos',
            'statusHistories.user:id,name',
            'assignments.crew:id,name,code',
            'assignments.assignedBy:id,name',
            'interventions.materials',
            'interventions.user:id,name',
            'interventions.crew:id,name,code',
            'notificationLogs',
        ]);

        return Inertia::render('complaints/admin/show', [
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
                'notification_logs' => $complaint->notificationLogs->map(fn ($log): array => [
                    'id' => $log->id,
                    'channel' => $log->channel,
                    'recipient' => $log->recipient,
                    'type' => $log->type,
                    'attempted_at' => $log->attempted_at?->toISOString(),
                    'status' => $log->status,
                    'error' => $log->error,
                ])->values(),
            ],
            'options' => $this->options(),
            'nearbyComplaints' => $this->nearbyComplaints($complaint),
        ]);
    }

    public function updateNeighbor(UpdateComplaintNeighborRequest $request, Complaint $complaint): RedirectResponse
    {
        $validated = $request->validated();
        $oldValues = $complaint->only(array_keys($validated));

        DB::transaction(function () use ($complaint, $validated, $oldValues): void {
            $complaint->update([
                'first_name' => $validated['first_name'],
                'last_name' => filled($validated['last_name'] ?? null) ? $validated['last_name'] : null,
                'dni' => $validated['dni'],
                'phone' => $validated['phone'],
                'email' => filled($validated['email'] ?? null) ? $validated['email'] : null,
                'street' => filled($validated['street'] ?? null) ? $validated['street'] : null,
                'street_number' => filled($validated['street_number'] ?? null) ? $validated['street_number'] : null,
                'neighborhood' => filled($validated['neighborhood'] ?? null) ? $validated['neighborhood'] : null,
                'location_reference' => filled($validated['location_reference'] ?? null) ? $validated['location_reference'] : null,
            ]);

            $complaint->statusHistories()->create([
                'user_id' => auth()->id(),
                'from_status' => $complaint->current_status,
                'to_status' => $complaint->current_status,
                'action' => 'neighbor_updated',
                'observation' => 'Datos del vecino actualizados.',
                'old_values' => $oldValues,
                'new_values' => $complaint->only(array_keys($validated)),
                'changed_at' => now(),
            ]);
        });

        return back()->with('success', 'Datos del vecino actualizados.');
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'zones' => OperationalZone::where('active', true)->orderBy('code')->get(['id', 'code', 'name', 'color']),
            'localities' => Locality::where('active', true)->orderBy('name')->get(['id', 'name', 'operational_zone_id']),
            'types' => ComplaintType::where('active', true)->orderBy('name')->get(['id', 'name']),
            'crews' => Crew::where('active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'statuses' => ComplaintStatus::options(),
        ];
    }

    private function applySearch(Builder $query, string $search): void
    {
        foreach ($this->searchTerms($search) as $term) {
            $like = "%{$term}%";
            $digits = $this->digitsOnly($term);

            $query->where(function (Builder $query) use ($term, $like, $digits): void {
                $query
                    ->orWhereRaw($this->compactSql('public_code').' like ?', ["%{$this->compactText($term)}%"])
                    ->orWhereRaw($this->normalizedSql('first_name').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('last_name').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('dni').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('street').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('street_number').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('neighborhood').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('location_reference').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('description').' like ?', [$like])
                    ->orWhereRaw($this->normalizedSql('other_problem_description').' like ?', [$like])
                    ->orWhereHas('category', fn (Builder $query) => $query->whereRaw($this->normalizedSql('name').' like ?', [$like]))
                    ->orWhereHas('type', fn (Builder $query) => $query->whereRaw($this->normalizedSql('name').' like ?', [$like]))
                    ->orWhereHas('locality', fn (Builder $query) => $query->whereRaw($this->normalizedSql('name').' like ?', [$like]))
                    ->orWhereHas('operationalZone', function (Builder $query) use ($like): void {
                        $query
                            ->whereRaw($this->normalizedSql('name').' like ?', [$like])
                            ->orWhereRaw($this->normalizedSql('code').' like ?', [$like]);
                    });

                if ($digits !== '') {
                    $query
                        ->orWhereRaw($this->phoneSql('phone').' like ?', ["%{$digits}%"])
                        ->orWhereRaw($this->phoneSql('dni').' like ?', ["%{$digits}%"]);
                }

                $matchingStatuses = $this->matchingStatusesForTerm($term);

                if ($matchingStatuses !== []) {
                    $query->orWhereIn('current_status', $matchingStatuses);
                }
            });
        }
    }

    private function orderBySearchRelevance(Builder $query, string $search): void
    {
        $compactSearch = $this->compactText($search);
        $digits = $this->digitsOnly($search);

        $query->orderByRaw(
            'case
                when '.$this->compactSql('public_code').' = ? then 0
                when '.$this->compactSql('public_code').' like ? then 1
                when '.$this->compactSql('public_code').' like ? then 2
                when '.$this->phoneSql('phone').' = ? then 3
                when '.$this->phoneSql('dni').' = ? then 3
                when '.$this->normalizedSql('first_name').' like ? then 4
                when '.$this->normalizedSql('last_name').' like ? then 4
                else 5
            end',
            [
                $compactSearch,
                "{$compactSearch}%",
                "%{$compactSearch}%",
                $digits,
                $digits,
                $this->normalizeText($search).'%',
                $this->normalizeText($search).'%',
            ],
        );
    }

    /**
     * @return array<int, string>
     */
    private function searchTerms(string $search): array
    {
        return collect(explode(' ', $this->normalizeText($search)))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function matchingStatusesForTerm(string $term): array
    {
        return collect(ComplaintStatus::options())
            ->filter(fn (array $status): bool => str_contains($this->normalizeText($status['label']), $term)
                || str_contains($this->normalizeText($status['value']), $term))
            ->pluck('value')
            ->all();
    }

    private function normalizeText(string $value): string
    {
        return Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->squish()
            ->toString();
    }

    private function compactText(string $value): string
    {
        return Str::of($this->normalizeText($value))->replace(' ', '')->toString();
    }

    private function digitsOnly(string $value): string
    {
        return Str::of($value)->replaceMatches('/\D+/', '')->toString();
    }

    private function normalizedSql(string $column): string
    {
        $expression = "lower(coalesce({$column}, ''))";

        foreach ([
            'á' => 'a',
            'Á' => 'a',
            'é' => 'e',
            'É' => 'e',
            'í' => 'i',
            'Í' => 'i',
            'ó' => 'o',
            'Ó' => 'o',
            'ú' => 'u',
            'Ú' => 'u',
            'ü' => 'u',
            'Ü' => 'u',
            'ñ' => 'n',
            'Ñ' => 'n',
        ] as $from => $to) {
            $expression = "replace({$expression}, '{$from}', '{$to}')";
        }

        return $expression;
    }

    private function compactSql(string $column): string
    {
        $expression = $this->normalizedSql($column);

        foreach ([' ', '-', '_', '.', '/', '#'] as $character) {
            $expression = "replace({$expression}, '{$character}', '')";
        }

        return $expression;
    }

    private function phoneSql(string $column): string
    {
        $expression = "coalesce({$column}, '')";

        foreach ([' ', '-', '(', ')', '+', '.'] as $character) {
            $expression = "replace({$expression}, '{$character}', '')";
        }

        return $expression;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function nearbyComplaints(Complaint $complaint): array
    {
        if (! $complaint->latitude || ! $complaint->longitude) {
            return [];
        }

        return Complaint::query()
            ->with(['type:id,name'])
            ->whereKeyNot($complaint->id)
            ->whereIn('current_status', ComplaintStatus::pendingValues())
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(function (Complaint $nearbyComplaint) use ($complaint): array {
                $distance = $this->distanceInMeters((float) $complaint->latitude, (float) $complaint->longitude, (float) $nearbyComplaint->latitude, (float) $nearbyComplaint->longitude);

                return [
                    'id' => $nearbyComplaint->id,
                    'public_code' => $nearbyComplaint->public_code,
                    'type' => $nearbyComplaint->type->name,
                    'distance' => round($distance),
                ];
            })
            ->filter(fn (array $nearbyComplaint): bool => $nearbyComplaint['distance'] <= 300)
            ->sortBy('distance')
            ->values()
            ->all();
    }

    private function distanceInMeters(float $latA, float $lonA, float $latB, float $lonB): float
    {
        $earthRadius = 6371000;
        $deltaLat = deg2rad($latB - $latA);
        $deltaLon = deg2rad($lonB - $lonA);

        $a = sin($deltaLat / 2) ** 2
            + cos(deg2rad($latA)) * cos(deg2rad($latB)) * sin($deltaLon / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
