<?php

namespace App\Models;

use Database\Factories\IntakeDepartmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'description', 'color', 'active'])]
class IntakeDepartment extends Model
{
    /** @use HasFactory<IntakeDepartmentFactory> */
    use HasFactory;

    public function derivations(): HasMany
    {
        return $this->hasMany(IntakeDerivation::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }
}
