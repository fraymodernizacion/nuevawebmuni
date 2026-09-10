<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'complaint_intervention_id',
    'inventory_item_id',
    'inventory_item_code',
    'inventory_item_name',
    'inventory_item_unit',
    'description',
    'quantity',
    'unit',
])]
class ComplaintMaterial extends Model
{
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(ComplaintIntervention::class, 'complaint_intervention_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }
}
