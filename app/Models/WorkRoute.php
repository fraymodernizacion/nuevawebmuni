<?php

namespace App\Models;

use App\Enums\WorkRouteStatus;
use Database\Factories\WorkRouteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['date', 'operational_zone_id', 'crew_id', 'created_by', 'status', 'notes', 'started_at', 'finished_at'])]
class WorkRoute extends Model
{
    /** @use HasFactory<WorkRouteFactory> */
    use HasFactory;

    public function operationalZone(): BelongsTo
    {
        return $this->belongsTo(OperationalZone::class);
    }

    public function crew(): BelongsTo
    {
        return $this->belongsTo(Crew::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function complaints(): BelongsToMany
    {
        return $this->belongsToMany(Complaint::class)
            ->withPivot(['route_order', 'added_at'])
            ->withTimestamps()
            ->orderByPivot('route_order');
    }

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'status' => WorkRouteStatus::class,
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }
}
