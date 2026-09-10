<?php

namespace App\Models;

use App\Enums\IntakeRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['intake_request_id', 'user_id', 'from_status', 'to_status', 'action', 'public_comment', 'internal_comment', 'new_values', 'changed_at'])]
class IntakeRequestHistory extends Model
{
    public function request(): BelongsTo
    {
        return $this->belongsTo(IntakeRequest::class, 'intake_request_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'from_status' => IntakeRequestStatus::class,
            'to_status' => IntakeRequestStatus::class,
            'new_values' => 'array',
            'changed_at' => 'datetime',
        ];
    }
}
