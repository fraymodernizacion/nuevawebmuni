<?php

namespace App\Services\Complaints;

use App\Models\Locality;
use Illuminate\Database\Eloquent\Collection;

class LocalityResolver
{
    /**
     * @var Collection<int, Locality>|null
     */
    private ?Collection $localities = null;

    public function resolve(float $latitude, float $longitude): ?Locality
    {
        return $this->localities()
            ->first(fn (Locality $locality): bool => $this->containsPoint($locality, $latitude, $longitude));
    }

    /**
     * @return Collection<int, Locality>
     */
    private function localities(): Collection
    {
        return $this->localities ??= Locality::with('operationalZone')
            ->where('active', true)
            ->whereNotNull('boundary')
            ->get();
    }

    private function containsPoint(Locality $locality, float $latitude, float $longitude): bool
    {
        $rings = $locality->boundary['coordinates'] ?? [];

        if (! is_array($rings) || $rings === []) {
            return false;
        }

        $isInsideOuterRing = $this->pointInRing($latitude, $longitude, $rings[0] ?? []);

        if (! $isInsideOuterRing) {
            return false;
        }

        foreach (array_slice($rings, 1) as $innerRing) {
            if ($this->pointInRing($latitude, $longitude, $innerRing)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, array{latitude?: mixed, longitude?: mixed}>  $ring
     */
    private function pointInRing(float $latitude, float $longitude, array $ring): bool
    {
        $isInside = false;
        $pointCount = count($ring);

        if ($pointCount < 3) {
            return false;
        }

        for ($i = 0, $j = $pointCount - 1; $i < $pointCount; $j = $i++) {
            $currentLatitude = (float) ($ring[$i]['latitude'] ?? 0);
            $currentLongitude = (float) ($ring[$i]['longitude'] ?? 0);
            $previousLatitude = (float) ($ring[$j]['latitude'] ?? 0);
            $previousLongitude = (float) ($ring[$j]['longitude'] ?? 0);

            $crossesLatitude = ($currentLatitude > $latitude) !== ($previousLatitude > $latitude);

            if (! $crossesLatitude) {
                continue;
            }

            $intersectionLongitude = ($previousLongitude - $currentLongitude)
                * ($latitude - $currentLatitude)
                / ($previousLatitude - $currentLatitude)
                + $currentLongitude;

            if ($longitude < $intersectionLongitude) {
                $isInside = ! $isInside;
            }
        }

        return $isInside;
    }
}
