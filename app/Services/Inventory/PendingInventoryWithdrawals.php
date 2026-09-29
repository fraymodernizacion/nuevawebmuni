<?php

namespace App\Services\Inventory;

use App\Models\Complaint;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class PendingInventoryWithdrawals
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function forUserAndItem(User $user, InventoryItem $inventoryItem): Collection
    {
        return $this->withPendingQuantities(
            InventoryMovement::query()
                ->with('inventoryItem:id,code,name,unit,current_stock,minimum_stock')
                ->whereBelongsTo($inventoryItem)
                ->where('movement_type', 'provisional_withdrawal')
                ->where(function ($query) use ($user): void {
                    $query->whereBelongsTo($user);

                    if ($user->primary_crew_id !== null) {
                        $query->orWhere('metadata->crew_id', $user->primary_crew_id);
                    }
                })
                ->oldest()
                ->get(),
        );
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function forComplaint(Complaint $complaint, User $user): Collection
    {
        $withdrawals = InventoryMovement::query()
            ->with('inventoryItem:id,code,name,unit,current_stock,minimum_stock')
            ->where('movement_type', 'provisional_withdrawal')
            ->oldest()
            ->get();

        return $this->withPendingQuantities($withdrawals)
            ->groupBy(fn (array $withdrawal): int => $withdrawal['inventory_item']->id)
            ->map(function (Collection $withdrawals): array {
                $firstWithdrawal = $withdrawals->first();

                return [
                    'inventory_item' => $firstWithdrawal['inventory_item'],
                    'withdrawn_quantity' => round($withdrawals->sum('withdrawn_quantity'), 2),
                    'used_quantity' => round($withdrawals->sum('used_quantity'), 2),
                    'returned_quantity' => round($withdrawals->sum('returned_quantity'), 2),
                    'pending_quantity' => round($withdrawals->sum('pending_quantity'), 2),
                    'withdrawals' => $withdrawals->values(),
                ];
            })
            ->filter(fn (array $item): bool => $item['pending_quantity'] > 0)
            ->values();
    }

    /**
     * @return Collection<int, array{movement: InventoryMovement, quantity: float}>
     */
    public function allocateForComplaint(InventoryItem $inventoryItem, float $quantity, Complaint $complaint, User $user): Collection
    {
        $pendingWithdrawals = $this->forComplaint($complaint, $user)
            ->first(fn (array $pendingItem): bool => $pendingItem['inventory_item']->id === $inventoryItem->id);

        if (! $pendingWithdrawals || $pendingWithdrawals['pending_quantity'] < $quantity) {
            return collect();
        }

        $remainingQuantity = $quantity;

        return collect($pendingWithdrawals['withdrawals'])
            ->map(function (array $withdrawal) use (&$remainingQuantity): ?array {
                if ($remainingQuantity <= 0) {
                    return null;
                }

                $quantityToUse = min($remainingQuantity, $withdrawal['pending_quantity']);
                $remainingQuantity = round($remainingQuantity - $quantityToUse, 2);

                return [
                    'movement' => $withdrawal['movement'],
                    'quantity' => $quantityToUse,
                ];
            })
            ->filter()
            ->values();
    }

    public function pendingForWithdrawal(InventoryMovement $withdrawal): float
    {
        return (float) $this->withPendingQuantities(new EloquentCollection([$withdrawal]))->first()['pending_quantity'];
    }

    /**
     * @param  EloquentCollection<int, InventoryMovement>  $withdrawals
     * @return Collection<int, array<string, mixed>>
     */
    private function withPendingQuantities(EloquentCollection $withdrawals): Collection
    {
        if ($withdrawals->isEmpty()) {
            return collect();
        }

        $withdrawalIds = $withdrawals->pluck('id')->all();
        $appliedQuantities = InventoryMovement::query()
            ->whereIn('movement_type', ['complaint_consumption', 'return_surplus'])
            ->get(['id', 'movement_type', 'quantity', 'metadata'])
            ->toBase()
            ->groupBy(fn (InventoryMovement $movement): int => (int) ($movement->metadata['withdrawal_movement_id'] ?? 0))
            ->only($withdrawalIds);

        return $withdrawals
            ->map(function (InventoryMovement $withdrawal) use ($appliedQuantities): array {
                $relatedMovements = $appliedQuantities->get($withdrawal->id, collect());
                $usedQuantity = round((float) $relatedMovements
                    ->where('movement_type', 'complaint_consumption')
                    ->sum(fn (InventoryMovement $movement): float => (float) $movement->quantity), 2);
                $returnedQuantity = round((float) $relatedMovements
                    ->where('movement_type', 'return_surplus')
                    ->sum(fn (InventoryMovement $movement): float => (float) $movement->quantity), 2);
                $withdrawnQuantity = (float) $withdrawal->quantity;
                $pendingQuantity = round($withdrawnQuantity - $usedQuantity - $returnedQuantity, 2);

                return [
                    'movement' => $withdrawal,
                    'inventory_item' => $withdrawal->inventoryItem,
                    'withdrawn_quantity' => $withdrawnQuantity,
                    'used_quantity' => $usedQuantity,
                    'returned_quantity' => $returnedQuantity,
                    'pending_quantity' => $pendingQuantity,
                    'created_at' => $withdrawal->created_at,
                    'metadata' => $withdrawal->metadata ?? [],
                ];
            })
            ->filter(fn (array $withdrawal): bool => $withdrawal['pending_quantity'] > 0)
            ->values();
    }
}
