<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['complaint_id', 'channel', 'recipient', 'type', 'attempted_at', 'status', 'external_id', 'error', 'payload'])]
class NotificationLog extends Model
{
    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
            'payload' => 'array',
        ];
    }
}
