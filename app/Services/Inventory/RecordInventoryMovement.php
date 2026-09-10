<?php

namespace App\Services\Inventory;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordInventoryMovement
{
    /**
     * @param  array{movement_type:string,quantity:int|float|string,reference?:string|null,reason?:string|null}  $data
     */
    public function execute(string $itemCode, array $data, User $user, ?string $ipAddress, ?string $userAgent): InventoryMovement
    {
        return DB::transaction(function () use ($itemCode, $data, $user, $ipAddress, $userAgent): InventoryMovement {
            $inventoryItem = InventoryItem::query()
                ->where('code', $itemCode)
                ->lockForUpdate()
                ->first();

            if (! $inventoryItem) {
                throw ValidationException::withMessages([
                    'code' => 'El insumo escaneado no existe en el inventario.',
                ]);
            }

            $quantity = round((float) $data['quantity'], 2);
            $stockBefore = round((float) $inventoryItem->current_stock, 2);
            $stockAfter = match ($data['movement_type']) {
                'exit' => round($stockBefore - $quantity, 2),
                'entry', 'recycled' => round($stockBefore + $quantity, 2),
                default => $stockBefore,
            };

            $inventoryItem->update([
                'current_stock' => $stockAfter,
            ]);

            return InventoryMovement::create([
                'inventory_item_id' => $inventoryItem->id,
                'user_id' => $user->id,
                'movement_type' => $data['movement_type'],
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'description' => $this->description($data['movement_type'], $data['reference'] ?? null, $data['reason'] ?? null),
                'metadata' => [
                    'inventory_item_code' => $inventoryItem->code,
                    'reference' => $data['reference'] ?? null,
                    'reason' => $data['reason'] ?? null,
                    'source' => 'qr_quick_movement',
                    'ip_address' => $ipAddress,
                    'user_agent' => $userAgent,
                ],
            ]);
        });
    }

    private function description(string $movementType, ?string $reference, ?string $reason): string
    {
        $label = match ($movementType) {
            'exit' => 'Salida',
            'entry' => 'Entrada',
            'recycled' => 'Reciclado',
            default => 'Movimiento',
        };

        if (filled($reference)) {
            return "{$label} QR - Referencia {$reference}";
        }

        if (filled($reason)) {
            return "{$label} QR - {$reason}";
        }

        return "{$label} QR";
    }
}
