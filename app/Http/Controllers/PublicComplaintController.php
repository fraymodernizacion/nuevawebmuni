<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePublicComplaintRequest;
use App\Http\Requests\TrackComplaintRequest;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\Locality;
use App\Services\Complaints\CreateComplaint;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicComplaintController extends Controller
{
    public function create(ComplaintCategory $category): Response
    {
        abort_unless($category->active, 404);

        $category->load(['types' => fn ($query) => $query->where('active', true)->orderBy('name')]);

        return Inertia::render('complaints/public/create', [
            'category' => $category->only(['id', 'code', 'slug', 'name']),
            'types' => $category->types->map->only(['id', 'name', 'requires_description'])->values(),
            'localities' => Locality::with('operationalZone:id,code,name,color')
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'operational_zone_id'])
                ->map(fn (Locality $locality): array => [
                    'id' => $locality->id,
                    'name' => $locality->name,
                    'zone' => $locality->operationalZone->only(['id', 'code', 'name', 'color']),
                ]),
        ]);
    }

    public function store(ComplaintCategory $category, StorePublicComplaintRequest $request, CreateComplaint $createComplaint): RedirectResponse
    {
        abort_unless($category->active, 404);

        $complaint = $createComplaint->handle($request->validated(), $category);

        return redirect()->route('complaints.public.received', $complaint);
    }

    public function received(Complaint $complaint): Response
    {
        return Inertia::render('complaints/public/received', [
            'complaint' => [
                'public_code' => $complaint->public_code,
                'phone' => $complaint->phone,
            ],
        ]);
    }

    public function trackCreate(): Response
    {
        return Inertia::render('complaints/public/track');
    }

    public function track(TrackComplaintRequest $request): Response|RedirectResponse
    {
        $validated = $request->validated();
        $complaint = Complaint::with([
            'category:id,name',
            'locality:id,name',
            'operationalZone:id,code,name,color',
            'type:id,name',
            'publicTimeline',
        ])
            ->where('public_code', $validated['public_code'])
            ->where('phone', $validated['phone'])
            ->first();

        if (! $complaint) {
            return back()->withErrors([
                'public_code' => 'No encontramos un reclamo con ese numero y telefono.',
            ]);
        }

        return Inertia::render('complaints/public/status', [
            'complaint' => [
                'public_code' => $complaint->public_code,
                'category' => $complaint->category?->name,
                'type' => $complaint->type->name,
                'created_at' => $complaint->created_at?->format('d/m/Y H:i'),
                'status' => $complaint->current_status->label(),
                'updated_at' => $complaint->updated_at?->format('d/m/Y H:i'),
                'description' => $complaint->description,
                'other_problem_description' => $complaint->other_problem_description,
                'location' => [
                    'locality' => $complaint->locality?->name,
                    'zone' => $complaint->operationalZone?->name,
                    'street' => $complaint->street,
                    'street_number' => $complaint->street_number,
                    'neighborhood' => $complaint->neighborhood,
                    'reference' => $complaint->location_reference,
                ],
                'timeline' => $complaint->publicTimeline->map(fn ($history): array => [
                    'action' => $history->action,
                    'status' => $history->to_status?->value,
                    'status_label' => $history->to_status?->label(),
                    'observation' => $history->observation,
                    'date' => $history->changed_at?->format('d/m/Y H:i'),
                ])->values(),
            ],
        ]);
    }
}
