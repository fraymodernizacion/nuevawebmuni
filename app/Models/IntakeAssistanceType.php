<?php

namespace App\Models;

use Database\Factories\IntakeAssistanceTypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['default_intake_department_id', 'slug', 'name', 'description', 'color', 'active'])]
class IntakeAssistanceType extends Model
{
    /** @use HasFactory<IntakeAssistanceTypeFactory> */
    use HasFactory;

    public function defaultDepartment(): BelongsTo
    {
        return $this->belongsTo(IntakeDepartment::class, 'default_intake_department_id');
    }

    public function requests(): BelongsToMany
    {
        return $this->belongsToMany(IntakeRequest::class)->withTimestamps();
    }

    public function derivations(): HasMany
    {
        return $this->hasMany(IntakeDerivation::class);
    }

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }
}
