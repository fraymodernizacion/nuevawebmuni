<?php

namespace App\Enums;

enum ComplaintStatus: string
{
    case New = 'new';
    case UnderReview = 'under_review';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case NeedsSecondVisit = 'needs_second_visit';
    case Resolved = 'resolved';
    case Closed = 'closed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::New => 'Nuevo',
            self::UnderReview => 'En revision',
            self::Assigned => 'Asignado',
            self::InProgress => 'En relevamiento',
            self::NeedsSecondVisit => 'Necesita segunda visita',
            self::Resolved => 'Resuelto',
            self::Closed => 'Cerrado',
            self::Cancelled => 'Cancelado',
        };
    }

    public function isOpen(): bool
    {
        return ! in_array($this, [self::Resolved, self::Closed, self::Cancelled], true);
    }

    /**
     * @return array<int, string>
     */
    public static function pendingValues(): array
    {
        return [
            self::New->value,
            self::UnderReview->value,
            self::Assigned->value,
            self::InProgress->value,
            self::NeedsSecondVisit->value,
        ];
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
