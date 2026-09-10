<?php

namespace App\Models;

use App\Enums\IntakeDerivationStatus;
use Database\Factories\IntakeDerivationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'intake_request_id',
    'intake_department_id',
    'intake_assistance_type_id',
    'created_by',
    'last_updated_by',
    'status',
    'operator_note',
    'department_response',
    'accepted_at',
    'completed_at',
])]
class IntakeDerivation extends Model
{
    /** @use HasFactory<IntakeDerivationFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'pending',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(IntakeRequest::class, 'intake_request_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(IntakeDepartment::class, 'intake_department_id');
    }

    public function assistanceType(): BelongsTo
    {
        return $this->belongsTo(IntakeAssistanceType::class, 'intake_assistance_type_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastUpdater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_updated_by');
    }

    protected function casts(): array
    {
        return [
            'status' => IntakeDerivationStatus::class,
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
