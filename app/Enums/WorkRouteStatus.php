<?php

namespace App\Enums;

enum WorkRouteStatus: string
{
    case Planned = 'planned';
    case InProgress = 'in_progress';
    case Finished = 'finished';

    public function label(): string
    {
        return match ($this) {
            self::Planned => 'Planificado',
            self::InProgress => 'En ejecucion',
            self::Finished => 'Finalizado',
        };
    }
}
