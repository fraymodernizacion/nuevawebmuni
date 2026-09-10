<?php

namespace App\Services\Notifications;

use App\Contracts\WhatsAppNotificationService;
use App\Models\Complaint;

class NullWhatsAppNotificationService implements WhatsAppNotificationService
{
    /**
     * @param  array<string, mixed>  $context
     * @return array{status: string, external_id?: string|null, error?: string|null}
     */
    public function sendComplaintMessage(Complaint $complaint, string $type, array $context = []): array
    {
        return [
            'status' => 'skipped',
            'external_id' => null,
            'error' => 'No WhatsApp provider configured.',
        ];
    }
}
