<?php

namespace App\Services\Complaints;

use App\Enums\ComplaintPhotoType;
use App\Enums\ComplaintStatus;
use App\Jobs\SendWhatsAppComplaintNotification;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\Locality;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateComplaint
{
    public function __construct(
        private ComplaintPhotoStorage $photoStorage,
        private LocalityResolver $localityResolver,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, ComplaintCategory $category): Complaint
    {
        return DB::transaction(function () use ($data, $category): Complaint {
            $locality = $this->resolveLocality($data);

            $complaint = Complaint::create([
                ...Arr::except($data, ['full_name', 'photo']),
                'locality_id' => $locality->id,
                'complaint_category_id' => $category->id,
                'operational_zone_id' => $locality->operational_zone_id,
                'public_code' => $this->nextPublicCode($category),
                'current_status' => ComplaintStatus::New,
                'location_needs_verification' => $this->locationNeedsVerification($data),
            ]);

            $complaint->statusHistories()->create([
                'to_status' => ComplaintStatus::New,
                'action' => 'created',
                'observation' => 'Reclamo recibido desde el formulario publico.',
                'new_values' => [
                    'locality' => $locality->name,
                    'zone' => $locality->operationalZone->code,
                ],
                'changed_at' => now(),
            ]);

            if (isset($data['photo'])) {
                $this->photoStorage->store($complaint, $data['photo'], ComplaintPhotoType::Initial);

                $complaint->statusHistories()->create([
                    'to_status' => $complaint->current_status,
                    'action' => 'photo_uploaded',
                    'observation' => 'Foto inicial cargada por el vecino.',
                    'changed_at' => now(),
                ]);
            }

            SendWhatsAppComplaintNotification::dispatch($complaint->id, 'received')->afterCommit();

            return $complaint->load(['type', 'locality.operationalZone']);
        });
    }

    private function nextPublicCode(ComplaintCategory $category): string
    {
        $year = now()->format('Y');
        $prefix = str($category->code)->substr(0, 3)->upper()->toString();
        $lastCode = Complaint::where('public_code', 'like', "{$prefix}-{$year}-%")
            ->lockForUpdate()
            ->latest('id')
            ->value('public_code');

        $nextNumber = $lastCode ? ((int) str($lastCode)->afterLast('-')->toString()) + 1 : 1;

        return sprintf('%s-%s-%06d', $prefix, $year, $nextNumber);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function locationNeedsVerification(array $data): bool
    {
        return filled($data['latitude'] ?? null) && filled($data['longitude'] ?? null) && blank($data['location_reference'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveLocality(array $data): Locality
    {
        if (filled($data['locality_id'] ?? null)) {
            return Locality::with('operationalZone')->findOrFail($data['locality_id']);
        }

        if (filled($data['latitude'] ?? null) && filled($data['longitude'] ?? null)) {
            $locality = $this->localityResolver->resolve((float) $data['latitude'], (float) $data['longitude']);

            if ($locality !== null) {
                return $locality;
            }
        }

        throw ValidationException::withMessages([
            'latitude' => 'No pudimos determinar la localidad con ese punto. Revisa el marcador en el mapa.',
        ]);
    }
}
