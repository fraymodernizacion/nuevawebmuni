<?php

namespace App\Support;

use Illuminate\Support\Collection;

class InventoryItemCategories
{
    /**
     * @return array<string, string>
     */
    public static function all(): array
    {
        return [
            'ALU-TOM' => 'Tomas y Enchufes',
            'ALU-VAR' => 'Varios (Accesorios, Herramientas menores, etc.)',
            'ALU-LUM' => 'Luminarias y Lamparas',
            'ALU-CAB' => 'Cables y Conductores',
            'ALU-HER' => 'Herrajes y Soportes',
            'ALU-CAN' => 'Canos y Canalizaciones',
            'ALU-CAJ' => 'Cajas y Gabinetes',
            'ALU-CON' => 'Conectores y Terminales',
            'ALU-LLA' => 'Llaves y Protecciones (Termicas, Disyuntores)',
            'ALU-FOT' => 'Fotocelulas y Fotocontroles',
            'ALU-FUS' => 'Fusibles',
        ];
    }

    /**
     * @return array<int, array{code: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::all())
            ->map(fn (string $label, string $code): array => [
                'code' => $code,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    public static function label(?string $code): ?string
    {
        if ($code === null) {
            return null;
        }

        return self::all()[$code] ?? null;
    }

    public static function codes(): Collection
    {
        return collect(array_keys(self::all()));
    }
}
