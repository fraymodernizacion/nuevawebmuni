<?php

namespace App\Enums;

enum IntakeRequestStatus: string
{
    case Received = 'received';
    case UnderReview = 'under_review';
    case Routed = 'routed';
    case NeedsDocumentation = 'needs_documentation';
    case Answered = 'answered';
    case Finished = 'finished';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Received => 'Recibido',
            self::UnderReview => 'En revision',
            self::Routed => 'Derivado',
            self::NeedsDocumentation => 'Requiere documentacion',
            self::Answered => 'Respondido',
            self::Finished => 'Finalizado',
            self::Rejected => 'Rechazado / no corresponde',
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
