<?php

namespace App\Http\Controllers;

use App\Enums\ComplaintPhotoType;
use App\Http\Requests\StorePublicComplaintRequest;
use App\Http\Requests\TrackComplaintRequest;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintPhoto;
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

    public function publicStatus(Complaint $complaint): Response
    {
        $complaint->load([
            'category:id,name',
            'locality:id,name',
            'operationalZone:id,code,name,color',
            'type:id,name',
            'photos',
            'publicTimeline',
        ]);

        return Inertia::render('complaints/public/status', [
            'complaint' => $this->statusPayload($complaint),
        ]);
    }

    public function trackCreate(): Response
    {
        return Inertia::render('complaints/public/track', [
            'complaintCategories' => ComplaintCategory::where('active', true)
                ->orderBy('name')
                ->get(['code', 'name'])
                ->map(fn (ComplaintCategory $category): array => [
                    'prefix' => str($category->code)->substr(0, 3)->upper()->toString(),
                    'name' => $category->name,
                ])
                ->values(),
            'currentYear' => now()->year,
        ]);
    }

    public function track(TrackComplaintRequest $request): Response|RedirectResponse
    {
        $validated = $request->validated();
        $trackingNumber = preg_replace('/\D+/', '', $validated['public_code']) ?? '';
        $paddedTrackingNumber = $trackingNumber === '' ? null : str_pad($trackingNumber, 6, '0', STR_PAD_LEFT);

        $complaint = Complaint::with([
            'category:id,name',
            'locality:id,name',
            'operationalZone:id,code,name,color',
            'type:id,name',
            'photos',
            'publicTimeline',
        ])
            ->where('dni', $validated['dni'])
            ->where(function ($query) use ($paddedTrackingNumber, $validated): void {
                $query->where('public_code', $validated['public_code']);

                if ($paddedTrackingNumber !== null) {
                    $query->orWhere('public_code', 'like', "%-{$paddedTrackingNumber}");
                }
            })
            ->first();

        if (! $complaint) {
            return back()->withErrors([
                'public_code' => 'No encontramos un reclamo con ese numero y DNI.',
            ]);
        }

        return Inertia::render('complaints/public/status', [
            'complaint' => $this->statusPayload($complaint),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function statusPayload(Complaint $complaint): array
    {
        $neighborPhotos = $complaint->photos
            ->where('type', ComplaintPhotoType::Initial)
            ->values();
        $crewPhotoTimeline = $complaint->photos
            ->where('type', '!=', ComplaintPhotoType::Initial)
            ->map(fn (ComplaintPhoto $photo): array => [
                'action' => 'photo',
                'status' => null,
                'status_label' => $photo->type->label(),
                'observation' => null,
                'date' => ($photo->taken_at ?? $photo->created_at)?->format('d/m/Y H:i'),
                'sort_date' => ($photo->taken_at ?? $photo->created_at)?->timestamp ?? 0,
                'photos' => [$this->photoPayload($photo)],
            ]);
        $historyTimeline = $complaint->publicTimeline->map(fn ($history): array => [
            'action' => $history->action,
            'status' => $history->to_status?->value,
            'status_label' => $history->to_status?->label(),
            'observation' => $history->observation,
            'date' => $history->changed_at?->format('d/m/Y H:i'),
            'sort_date' => $history->changed_at?->timestamp ?? 0,
            'photos' => [],
        ]);

        return [
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
                'latitude' => $complaint->latitude,
                'longitude' => $complaint->longitude,
                'maps_url' => $complaint->latitude !== null && $complaint->longitude !== null
                    ? 'https://www.google.com/maps/search/?api=1&query='.$complaint->latitude.','.$complaint->longitude
                    : null,
            ],
            'photos' => $neighborPhotos->map(fn (ComplaintPhoto $photo): array => $this->photoPayload($photo)),
            'timeline' => $historyTimeline
                ->concat($crewPhotoTimeline)
                ->sortByDesc('sort_date')
                ->map(function (array $item): array {
                    unset($item['sort_date']);

                    return $item;
                })
                ->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function photoPayload(ComplaintPhoto $photo): array
    {
        return [
            'id' => $photo->id,
            'type' => $photo->type->value,
            'type_label' => $photo->type->label(),
            'url' => $photo->url(),
            'original_name' => $photo->original_name,
            'taken_at' => $photo->taken_at?->format('d/m/Y H:i'),
        ];
    }
}
