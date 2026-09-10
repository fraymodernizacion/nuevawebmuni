<?php

namespace App\Enums;

enum ComplaintPhotoType: string
{
    case Initial = 'initial';
    case Intervention = 'intervention';
    case Resolution = 'resolution';

    public function label(): string
    {
        return match ($this) {
            self::Initial => 'Foto inicial',
            self::Intervention => 'Foto de intervencion',
            self::Resolution => 'Foto de resolucion',
        };
    }
}
