<?php

namespace App\Services\Inventory;

use App\Models\Complaint;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordInventoryMovement
{
    public function __construct(private PendingInventoryWithdrawals $pendingWithdrawals) {}

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
            $movementType = $this->movementType($data['movement_type']);
            $complaint = $this->complaintFromReference($data['reference'] ?? null);
            $stockAfter = match ($movementType) {
                'provisional_withdrawal' => round($stockBefore - $quantity, 2),
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
                'movement_type' => $movementType,
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'description' => $this->description($movementType, $data['reference'] ?? null, $data['reason'] ?? null),
                'metadata' => [
                    'inventory_item_code' => $inventoryItem->code,
                    'custody_user_id' => $user->id,
                    'custody_user_name' => $user->name,
                    'crew_id' => $user->primary_crew_id,
                    'crew_name' => $user->primaryCrew?->name,
                    'complaint_id' => $complaint?->id,
                    'complaint_public_code' => $complaint?->public_code,
                    'reference' => $data['reference'] ?? null,
                    'reason' => $data['reason'] ?? null,
                    'source' => 'qr_quick_movement',
                    'ip_address' => $ipAddress,
                    'user_agent' => $userAgent,
                ],
            ]);
        });
    }

    /**
     * @param  array{withdrawal_movement_id:int,quantity:int|float|string,reason?:string|null}  $data
     */
    public function returnSurplus(string $itemCode, array $data, User $user, ?string $ipAddress, ?string $userAgent): InventoryMovement
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

            $withdrawal = InventoryMovement::query()
                ->whereKey($data['withdrawal_movement_id'])
                ->whereBelongsTo($inventoryItem)
                ->where('movement_type', 'provisional_withdrawal')
                ->lockForUpdate()
                ->first();

            if (! $withdrawal) {
                throw ValidationException::withMessages([
                    'withdrawal_movement_id' => 'La salida provisoria seleccionada no existe.',
                ]);
            }

            $withdrawalCrewId = (int) ($withdrawal->metadata['crew_id'] ?? 0);
            $userCrewId = (int) $user->primary_crew_id;

            if (! $user->canManageInventory() && $withdrawal->user_id !== $user->id && ($userCrewId === 0 || $withdrawalCrewId !== $userCrewId)) {
                throw ValidationException::withMessages([
                    'withdrawal_movement_id' => 'Solo podes devolver material que tenes a cargo.',
                ]);
            }

            $quantity = round((float) $data['quantity'], 2);
            $pendingQuantity = $this->pendingWithdrawals->pendingForWithdrawal($withdrawal);

            if ($quantity > $pendingQuantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'La cantidad a devolver supera el pendiente de esta salida.',
                ]);
            }

            $stockBefore = round((float) $inventoryItem->current_stock, 2);
            $stockAfter = round($stockBefore + $quantity, 2);

            $inventoryItem->update([
                'current_stock' => $stockAfter,
            ]);

            return InventoryMovement::create([
                'inventory_item_id' => $inventoryItem->id,
                'user_id' => $user->id,
                'movement_type' => 'return_surplus',
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'description' => $this->returnDescription($withdrawal, $data['reason'] ?? null),
                'metadata' => [
                    'inventory_item_code' => $inventoryItem->code,
                    'withdrawal_movement_id' => $withdrawal->id,
                    'reason' => $data['reason'] ?? null,
                    'source' => 'qr_surplus_return',
                    'ip_address' => $ipAddress,
                    'user_agent' => $userAgent,
                ],
            ]);
        });
    }

    private function movementType(string $movementType): string
    {
        return $movementType === 'exit' ? 'provisional_withdrawal' : $movementType;
    }

    private function complaintFromReference(?string $reference): ?Complaint
    {
        if (blank($reference)) {
            return null;
        }

        return Complaint::query()
            ->where('public_code', trim($reference))
            ->first();
    }

    private function description(string $movementType, ?string $reference, ?string $reason): string
    {
        $label = match ($movementType) {
            'provisional_withdrawal' => 'Salida provisoria',
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

    private function returnDescription(InventoryMovement $withdrawal, ?string $reason): string
    {
        if (filled($reason)) {
            return "Devolucion de sobrante - {$reason}";
        }

        $reference = $withdrawal->metadata['reference'] ?? null;

        if (filled($reference)) {
            return "Devolucion de sobrante - Referencia {$reference}";
        }

        return 'Devolucion de sobrante';
    }
}
