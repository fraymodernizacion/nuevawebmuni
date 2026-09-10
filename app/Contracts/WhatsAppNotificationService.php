<?php

namespace App\Contracts;

use App\Models\Complaint;

interface WhatsAppNotificationService
{
    /**
     * @param  array<string, mixed>  $context
     * @return array{status: string, external_id?: string|null, error?: string|null}
     */
    public function sendComplaintMessage(Complaint $complaint, string $type, array $context = []): array;
}
