<?php

namespace Database\Seeders;

use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use App\Models\Crew;
use App\Models\Locality;
use App\Models\OperationalZone;
use Illuminate\Database\Seeder;
use SimpleXMLElement;

class ComplaintModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $category = ComplaintCategory::updateOrCreate(
            ['code' => 'alumbrado_publico'],
            ['slug' => 'alumbrado-publico', 'name' => 'Alumbrado Publico', 'active' => true],
        );

        foreach ([
            'Luminaria apagada',
            'Luminaria intermitente',
            'Luminaria encendida durante el dia',
            'Luminaria obstruida',
            'Poste danado',
            'Poste caido',
            'Cableado visible o en mal estado',
            'Cable cortado',
            'Otro',
        ] as $type) {
            ComplaintType::updateOrCreate(
                ['complaint_category_id' => $category->id, 'name' => $type],
                ['requires_description' => $type === 'Otro', 'active' => true],
            );
        }

        ComplaintType::where('complaint_category_id', $category->id)
            ->where('name', 'Sector con poca iluminacion')
            ->update(['active' => false]);

        $this->seedOperationalZonesAndLocalities();

        foreach ([
            ['legacy_code' => 'ALU-1', 'code' => 'ALU-MANANA', 'name' => 'Cuadrilla Turno Manana'],
            ['legacy_code' => 'ALU-2', 'code' => 'ALU-NOCHE', 'name' => 'Cuadrilla Turno Noche'],
            ['legacy_code' => 'ALU-3', 'code' => 'ALU-FINSEM', 'name' => 'Cuadrilla Fines de Semana y Feriados'],
        ] as $crewData) {
            $legacyCrew = Crew::where('code', $crewData['legacy_code'])->first();
            $targetCrew = Crew::where('code', $crewData['code'])->orderBy('id')->first();

            if ($legacyCrew !== null && $targetCrew !== null && ! $legacyCrew->is($targetCrew)) {
                $targetCrew->fill([
                    'code' => $targetCrew->code.'-DUP-'.$targetCrew->id,
                    'active' => false,
                ])->save();
            }

            $crew = $legacyCrew ?? $targetCrew ?? new Crew(['code' => $crewData['code']]);

            $crew->fill([
                'code' => $crewData['code'],
                'name' => $crewData['name'],
                'area' => 'alumbrado_publico',
                'active' => true,
            ])->save();

            Crew::where('code', $crewData['code'])
                ->whereKeyNot($crew->id)
                ->update(['active' => false]);
        }
    }

    private function seedOperationalZonesAndLocalities(): void
    {
        $zones = [
            ['code' => 'A', 'name' => 'Zona A', 'color' => '#dc2626', 'localities' => ['San Antonio', 'La Falda de San Antonio']],
            ['code' => 'B', 'name' => 'Zona B', 'color' => '#ca8a04', 'localities' => ['La Tercena', 'Piedra Blanca', 'San José', 'El Hueco']],
            ['code' => 'C', 'name' => 'Zona C', 'color' => '#16a34a', 'localities' => ['La Carrera', 'Collagasta']],
            ['code' => 'D', 'name' => 'Zona D', 'color' => '#2563eb', 'localities' => ['Pomancillo', 'Las Pirquitas', 'Villa Las Pirquitas', 'Pomancillo Este', 'Pomancillo Oeste']],
        ];
        $boundaries = $this->districtBoundaries();

        foreach ($zones as $zoneData) {
            $zone = OperationalZone::updateOrCreate(
                ['code' => $zoneData['code']],
                ['name' => $zoneData['name'], 'color' => $zoneData['color'], 'active' => true],
            );

            foreach ($zoneData['localities'] as $locality) {
                Locality::updateOrCreate(
                    ['name' => $locality],
                    [
                        'operational_zone_id' => $zone->id,
                        'active' => true,
                        'boundary' => $boundaries[$locality] ?? null,
                    ],
                );
            }
        }
    }

    /**
     * @return array<string, array{type: string, coordinates: array<int, array<int, array{latitude: float, longitude: float}>>}>
     */
    private function districtBoundaries(): array
    {
        $path = database_path('seeders/data/Distritos.kml');

        if (! is_file($path)) {
            return [];
        }

        $xml = simplexml_load_file($path);

        if (! $xml instanceof SimpleXMLElement) {
            return [];
        }

        $xml->registerXPathNamespace('kml', 'http://www.opengis.net/kml/2.2');

        $boundaries = [];

        foreach ($xml->xpath('//kml:Placemark') ?: [] as $placemark) {
            $placemark->registerXPathNamespace('kml', 'http://www.opengis.net/kml/2.2');

            $name = $this->placemarkName($placemark);
            $coordinates = $placemark->xpath('.//kml:outerBoundaryIs/kml:LinearRing/kml:coordinates');
            $coordinateText = trim((string) ($coordinates[0] ?? ''));

            if ($name === null || $coordinateText === '') {
                continue;
            }

            $boundaries[$name] = [
                'type' => 'Polygon',
                'coordinates' => [$this->parseCoordinates($coordinateText)],
            ];
        }

        return $boundaries;
    }

    private function placemarkName(SimpleXMLElement $placemark): ?string
    {
        foreach ($placemark->xpath('.//kml:SimpleData') ?: [] as $data) {
            if ((string) $data['name'] === 'nam') {
                return trim((string) $data);
            }
        }

        return null;
    }

    /**
     * @return array<int, array{latitude: float, longitude: float}>
     */
    private function parseCoordinates(string $coordinates): array
    {
        return collect(preg_split('/\s+/', trim($coordinates)) ?: [])
            ->filter()
            ->map(function (string $coordinate): array {
                [$longitude, $latitude] = array_pad(explode(',', $coordinate), 2, null);

                return [
                    'latitude' => (float) $latitude,
                    'longitude' => (float) $longitude,
                ];
            })
            ->values()
            ->all();
    }
}
