<?php

namespace App\Models;

use Database\Factories\LocalityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['operational_zone_id', 'name', 'active', 'boundary'])]
class Locality extends Model
{
    /** @use HasFactory<LocalityFactory> */
    use HasFactory;

    public function operationalZone(): BelongsTo
    {
        return $this->belongsTo(OperationalZone::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'boundary' => 'array',
        ];
    }
}
