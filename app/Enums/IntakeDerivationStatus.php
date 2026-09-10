<?php

namespace App\Enums;

enum IntakeDerivationStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case NotApplicable = 'not_applicable';
    case NeedsInformation = 'needs_information';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendiente de revision',
            self::Accepted => 'Aceptada',
            self::InProgress => 'En gestion',
            self::Completed => 'Resuelta por el area',
            self::NotApplicable => 'No corresponde al area',
            self::NeedsInformation => 'Requiere mas informacion',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $status): array => ['value' => $status->value, 'label' => $status->label()],
            self::cases(),
        );
    }
}
