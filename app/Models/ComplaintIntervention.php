<?php

namespace App\Models;

use App\Enums\ComplaintStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['complaint_id', 'crew_id', 'user_id', 'status', 'response_code', 'citizen_message', 'observations', 'internal_supplies_notes', 'second_visit_reason', 'suggested_second_visit_date', 'performed_at'])]
class ComplaintIntervention extends Model
{
    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }

    public function crew(): BelongsTo
    {
        return $this->belongsTo(Crew::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(ComplaintMaterial::class);
    }

    protected function casts(): array
    {
        return [
            'status' => ComplaintStatus::class,
            'suggested_second_visit_date' => 'date',
            'performed_at' => 'datetime',
        ];
    }
}
