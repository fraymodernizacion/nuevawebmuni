<?php

namespace App\Models;

use Database\Factories\ComplaintTypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['complaint_category_id', 'name', 'requires_description', 'active'])]
class ComplaintType extends Model
{
    /** @use HasFactory<ComplaintTypeFactory> */
    use HasFactory;

    public function category(): BelongsTo
    {
        return $this->belongsTo(ComplaintCategory::class, 'complaint_category_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    protected function casts(): array
    {
        return [
            'requires_description' => 'boolean',
            'active' => 'boolean',
        ];
    }
}
