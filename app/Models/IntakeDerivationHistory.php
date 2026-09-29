<?php

namespace App\Models;

use App\Enums\IntakeDerivationStatus;
use Database\Factories\IntakeDerivationHistoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'intake_derivation_id',
    'user_id',
    'from_status',
    'to_status',
    'action',
    'previous_response',
    'new_response',
    'changed_at',
    'operator_seen_at',
])]
class IntakeDerivationHistory extends Model
{
    /** @use HasFactory<IntakeDerivationHistoryFactory> */
    use HasFactory;

    public function derivation(): BelongsTo
    {
        return $this->belongsTo(IntakeDerivation::class, 'intake_derivation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'from_status' => IntakeDerivationStatus::class,
            'to_status' => IntakeDerivationStatus::class,
            'changed_at' => 'datetime',
            'operator_seen_at' => 'datetime',
        ];
    }
}
