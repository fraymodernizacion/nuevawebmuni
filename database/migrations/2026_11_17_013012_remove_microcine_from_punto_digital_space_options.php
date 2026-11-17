<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const NAME = 'Pedir un espacio en Punto Digital';

    private const SITES = [
        'Punto Digital Piedra Blanca',
        'Punto Digital La Tercena',
        'Punto Digital San Antonio',
    ];

    public function up(): void
    {
        $this->updateSpace(self::NAME.' o Microcine', [...self::SITES, 'Microcine'], self::NAME, self::SITES);
    }

    public function down(): void
    {
        $this->updateSpace(self::NAME, self::SITES, self::NAME.' o Microcine', [...self::SITES, 'Microcine']);
    }

    /**
     * @param  list<string>  $previousOptions
     * @param  list<string>  $nextOptions
     */
    private function updateSpace(string $previousName, array $previousOptions, string $nextName, array $nextOptions): void
    {
        $subtype = DB::table('intake_request_subtypes')
            ->where('slug', 'uso-punto-digital-microcine')
            ->where('intake_request_type_id', DB::table('intake_request_types')
                ->select('id')
                ->where('slug', 'modernizacion-punto-digital'))
            ->first(['id', 'name', 'schema']);

        if (! $subtype?->schema) {
            return;
        }

        $fields = json_decode($subtype->schema, true, flags: JSON_THROW_ON_ERROR);

        foreach ($fields as $index => $field) {
            if (($field['name'] ?? null) === 'espacio' && ($field['options'] ?? null) === $previousOptions) {
                $fields[$index]['options'] = $nextOptions;
                DB::table('intake_request_subtypes')->where('id', $subtype->id)->update([
                    'name' => $subtype->name === $previousName ? $nextName : $subtype->name,
                    'schema' => json_encode($fields, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);

                return;
            }
        }
    }
};
