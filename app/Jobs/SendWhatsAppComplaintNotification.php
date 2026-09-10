<?php

namespace App\Jobs;

use App\Contracts\WhatsAppNotificationService;
use App\Models\Complaint;
use App\Models\NotificationLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SendWhatsAppComplaintNotification implements ShouldQueue
{
    use Queueable;

    public int $complaintId;

    public string $type;

    /**
     * @var array<string, mixed>
     */
    public array $context = [];

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 60, 180];

    /**
     * Create a new job instance.
     *
     * @param  array<string, mixed>  $context
     */
    public function __construct(int $complaintId, string $type, array $context = [])
    {
        $this->complaintId = $complaintId;
        $this->type = $type;
        $this->context = $context;
    }

    /**
     * Execute the job.
     */
    public function handle(WhatsAppNotificationService $service): void
    {
        $complaint = Complaint::with(['type:id,name'])->findOrFail($this->complaintId);
        $result = $service->sendComplaintMessage($complaint, $this->type, $this->context);

        NotificationLog::create([
            'complaint_id' => $complaint->id,
            'channel' => 'whatsapp',
            'recipient' => $result['recipient'] ?? data_get($result, 'payload.number', $complaint->phone),
            'type' => $this->type,
            'attempted_at' => now(),
            'status' => $result['status'],
            'external_id' => $result['external_id'] ?? null,
            'error' => $result['error'] ?? null,
            'payload' => [
                'public_code' => $complaint->public_code,
                'status' => $complaint->current_status->value,
                'context' => $this->context,
                'provider_payload' => $result['payload'] ?? null,
            ],
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        $complaint = Complaint::find($this->complaintId);

        if (! $complaint) {
            return;
        }

        NotificationLog::create([
            'complaint_id' => $complaint->id,
            'channel' => 'whatsapp',
            'recipient' => $complaint->phone,
            'type' => $this->type,
            'attempted_at' => now(),
            'status' => 'failed',
            'error' => $exception?->getMessage(),
            'payload' => [
                'public_code' => $complaint->public_code,
                'context' => $this->context,
            ],
        ]);
    }
}
