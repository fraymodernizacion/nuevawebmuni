<?php

namespace App\Support;

class UserModules
{
    /**
     * @return array<string, string>
     */
    public static function labels(): array
    {
        return [
            'complaints_management' => 'Gestión de reclamos',
            'complaint_operations' => 'Operativa de reclamos',
            'crew_work' => 'Mis trabajos',
            'intake_management' => 'Mesa de entrada',
            'intake_configuration' => 'Configuración de derivaciones',
            'intake_department' => 'Mis derivaciones',
            'inventory_management' => 'Inventario',
            'inventory_movements' => 'Movimientos de inventario',
            'route_planning' => 'Planificación de recorridos',
            'user_management' => 'Gestión de usuarios',
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_keys(self::labels());
    }

    /**
     * @param  array<string, mixed>|null  $permissions
     * @return array<string, bool>
     */
    public static function normalize(?array $permissions): array
    {
        return collect(self::keys())
            ->mapWithKeys(fn (string $key): array => [$key => self::enabled($permissions[$key] ?? false)])
            ->all();
    }

    private static function enabled(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
