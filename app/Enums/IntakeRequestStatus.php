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
    case Suspended = 'suspended';
    case Pending = 'pending';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Received => 'Recibido',
            self::UnderReview => 'En Revisión',
            self::Routed => 'Derivado',
            self::NeedsDocumentation => 'Requiere documentación',
            self::Answered => 'Respondido',
            self::Finished => 'Finalizado',
            self::Suspended => 'Suspendido',
            self::Pending => 'Pendiente',
            self::Rejected => 'Rechazado/ No corresponde',
        };
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $status): array => ['value' => $status->value, 'label' => $status->label()],
            [self::Received, self::UnderReview, self::Routed, self::NeedsDocumentation,
                self::Finished, self::Suspended, self::Pending, self::Rejected],
        );
    }
}
