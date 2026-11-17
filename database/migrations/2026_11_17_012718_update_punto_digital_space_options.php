<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const PREVIOUS_OPTIONS = ['Punto Digital', 'Microcine'];

    private const UPDATED_OPTIONS = [
        'Punto Digital Piedra Blanca',
        'Punto Digital La Tercena',
        'Punto Digital San Antonio',
        'Microcine',
    ];

    public function up(): void
    {
        $this->replaceOptions(self::PREVIOUS_OPTIONS, self::UPDATED_OPTIONS);
    }

    public function down(): void
    {
        $this->replaceOptions(self::UPDATED_OPTIONS, self::PREVIOUS_OPTIONS);
    }

    /**
     * @param  list<string>  $previous
     * @param  list<string>  $replacement
     */
    private function replaceOptions(array $previous, array $replacement): void
    {
        $subtype = DB::table('intake_request_subtypes')
            ->where('slug', 'uso-punto-digital-microcine')
            ->where('intake_request_type_id', DB::table('intake_request_types')
                ->select('id')
                ->where('slug', 'modernizacion-punto-digital'))
            ->first(['id', 'schema']);

        if (! $subtype?->schema) {
            return;
        }

        $fields = json_decode($subtype->schema, true, flags: JSON_THROW_ON_ERROR);

        foreach ($fields as $index => $field) {
            if (($field['name'] ?? null) === 'espacio' && ($field['options'] ?? null) === $previous) {
                $fields[$index]['options'] = $replacement;

                DB::table('intake_request_subtypes')->where('id', $subtype->id)->update([
                    'schema' => json_encode($fields, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);

                return;
            }
        }
    }
};
