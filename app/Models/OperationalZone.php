<?php

namespace App\Models;

use Database\Factories\OperationalZoneFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'color', 'active'])]
class OperationalZone extends Model
{
    /** @use HasFactory<OperationalZoneFactory> */
    use HasFactory;

    public function localities(): HasMany
    {
        return $this->hasMany(Locality::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    public function workRoutes(): HasMany
    {
        return $this->hasMany(WorkRoute::class);
    }

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }
}
