<?php

namespace App\Models;

use Database\Factories\IntakeRequestTypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'category', 'description', 'icon', 'color', 'estimated_time', 'requirements', 'schema', 'active'])]
class IntakeRequestType extends Model
{
    /** @use HasFactory<IntakeRequestTypeFactory> */
    use HasFactory;

    public function requests(): HasMany
    {
        return $this->hasMany(IntakeRequest::class);
    }

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
            'schema' => 'array',
            'active' => 'boolean',
        ];
    }
}
