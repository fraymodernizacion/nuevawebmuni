<?php

namespace App\Models;

use App\Enums\IntakeRequestStatus;
use Database\Factories\IntakeRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'intake_request_type_id',
    'assigned_to',
    'public_code',
    'status',
    'priority',
    'area',
    'source',
    'applicant_name',
    'applicant_dni',
    'applicant_phone',
    'applicant_email',
    'applicant_address',
    'subject',
    'summary',
    'payload',
    'internal_notes',
    'finished_at',
])]
class IntakeRequest extends Model
{
    /** @use HasFactory<IntakeRequestFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'received',
        'priority' => 'normal',
        'source' => 'web',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(IntakeRequestType::class, 'intake_request_type_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(IntakeRequestHistory::class)->latest('changed_at');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(IntakeRequestAttachment::class);
    }

    public function assistanceTypes(): BelongsToMany
    {
        return $this->belongsToMany(IntakeAssistanceType::class)->withTimestamps();
    }

    public function derivations(): HasMany
    {
        return $this->hasMany(IntakeDerivation::class);
    }

    protected function casts(): array
    {
        return [
            'status' => IntakeRequestStatus::class,
            'payload' => 'array',
            'finished_at' => 'datetime',
        ];
    }
}
