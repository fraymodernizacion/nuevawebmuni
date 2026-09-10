<?php

namespace App\Models;

use Database\Factories\InventoryItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code',
    'name',
    'description',
    'unit',
    'current_stock',
    'minimum_stock',
    'qr_value',
    'source_sheet',
    'source_row',
    'active',
])]
class InventoryItem extends Model
{
    /** @use HasFactory<InventoryItemFactory> */
    use HasFactory;

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function complaintMaterials(): HasMany
    {
        return $this->hasMany(ComplaintMaterial::class);
    }

    protected function casts(): array
    {
        return [
            'current_stock' => 'decimal:2',
            'minimum_stock' => 'decimal:2',
            'source_row' => 'integer',
            'active' => 'boolean',
        ];
    }
}
