<?php

namespace App\Models;

use App\Enums\ComplaintPriority;
use App\Enums\ComplaintStatus;
use Database\Factories\ComplaintFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'public_code',
    'complaint_category_id',
    'complaint_type_id',
    'locality_id',
    'operational_zone_id',
    'assigned_crew_id',
    'first_name',
    'last_name',
    'dni',
    'phone',
    'email',
    'street',
    'street_number',
    'neighborhood',
    'location_reference',
    'latitude',
    'longitude',
    'location_needs_verification',
    'description',
    'other_problem_description',
    'current_status',
    'priority',
    'resolved_at',
    'closed_at',
])]
class Complaint extends Model
{
    /** @use HasFactory<ComplaintFactory> */
    use HasFactory;

    protected $attributes = [
        'current_status' => 'new',
        'priority' => 'normal',
        'location_needs_verification' => false,
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ComplaintCategory::class, 'complaint_category_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(ComplaintType::class, 'complaint_type_id');
    }

    public function locality(): BelongsTo
    {
        return $this->belongsTo(Locality::class);
    }

    public function operationalZone(): BelongsTo
    {
        return $this->belongsTo(OperationalZone::class);
    }

    public function assignedCrew(): BelongsTo
    {
        return $this->belongsTo(Crew::class, 'assigned_crew_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ComplaintStatusHistory::class)->latest('changed_at');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ComplaintAssignment::class)->latest('assigned_at');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ComplaintPhoto::class)->latest();
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(ComplaintIntervention::class)->latest('performed_at');
    }

    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class)->latest('attempted_at');
    }

    public function workRoutes(): BelongsToMany
    {
        return $this->belongsToMany(WorkRoute::class)
            ->withPivot(['route_order', 'added_at'])
            ->withTimestamps()
            ->orderByPivot('route_order');
    }

    public function publicTimeline(): HasMany
    {
        return $this->statusHistories()->whereIn('action', [
            'created',
            'assigned',
            'status_changed',
            'intervention',
        ]);
    }

    protected function casts(): array
    {
        return [
            'current_status' => ComplaintStatus::class,
            'priority' => ComplaintPriority::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'location_needs_verification' => 'boolean',
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }
}
