<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventoryQuickMovementRequest;
use App\Http\Requests\StoreInventoryReturnRequest;
use App\Models\InventoryItem;
use App\Services\Inventory\PendingInventoryWithdrawals;
use App\Services\Inventory\RecordInventoryMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InventoryQrController extends Controller
{
    public function show(Request $request, string $code, PendingInventoryWithdrawals $pendingWithdrawals): Response
    {
        abort_unless($request->user()?->canUseInventoryQuickMovement(), 403);

        $normalizedCode = $this->normalizeCode($code);
        $inventoryItem = InventoryItem::query()
            ->where('code', $normalizedCode)
            ->first();
        $pendingReturns = $inventoryItem
            ? $pendingWithdrawals
                ->forUserAndItem($request->user(), $inventoryItem)
                ->map(fn (array $withdrawal): array => [
                    'id' => $withdrawal['movement']->id,
                    'withdrawn_quantity' => $withdrawal['withdrawn_quantity'],
                    'used_quantity' => $withdrawal['used_quantity'],
                    'returned_quantity' => $withdrawal['returned_quantity'],
                    'pending_quantity' => $withdrawal['pending_quantity'],
                    'reference' => $withdrawal['metadata']['reference'] ?? null,
                    'reason' => $withdrawal['metadata']['reason'] ?? null,
                    'created_at' => $withdrawal['created_at']?->toISOString(),
                    'return_url' => route('inventory.qr.returns.store', ['code' => $inventoryItem->code]),
                ])
                ->values()
            : [];

        return Inertia::render('inventory/quick/show', [
            'code' => $normalizedCode,
            'item' => $inventoryItem ? [
                'id' => $inventoryItem->id,
                'code' => $inventoryItem->code,
                'name' => $inventoryItem->name,
                'description' => $inventoryItem->description,
                'unit' => $inventoryItem->unit,
                'current_stock' => (float) $inventoryItem->current_stock,
                'minimum_stock' => (float) $inventoryItem->minimum_stock,
                'low_stock' => (float) $inventoryItem->current_stock <= (float) $inventoryItem->minimum_stock,
                'quick_url' => route('inventory.qr.show', ['code' => $inventoryItem->code]),
                'movement_store_url' => route('inventory.qr.movements.store', ['code' => $inventoryItem->code]),
                'return_store_url' => route('inventory.qr.returns.store', ['code' => $inventoryItem->code]),
            ] : null,
            'pendingReturns' => $pendingReturns,
            'permissions' => [
                'can_exit' => $request->user()->canRecordInventoryExit(),
                'can_entry' => $request->user()->canRecordInventoryEntry(),
                'can_recycled' => $request->user()->canRecordInventoryRecycled(),
            ],
        ]);
    }

    public function store(StoreInventoryQuickMovementRequest $request, string $code, RecordInventoryMovement $recordInventoryMovement): RedirectResponse
    {
        $movement = $recordInventoryMovement->execute(
            $this->normalizeCode($code),
            $request->validated(),
            $request->user(),
            $request->ip(),
            $request->userAgent(),
        );

        return redirect()
            ->route('inventory.qr.show', ['code' => $movement->inventoryItem->code])
            ->with('success', 'Movimiento registrado.');
    }

    public function storeReturn(StoreInventoryReturnRequest $request, string $code, RecordInventoryMovement $recordInventoryMovement): RedirectResponse
    {
        $movement = $recordInventoryMovement->returnSurplus(
            $this->normalizeCode($code),
            $request->validated(),
            $request->user(),
            $request->ip(),
            $request->userAgent(),
        );

        return redirect()
            ->route('inventory.qr.show', ['code' => $movement->inventoryItem->code])
            ->with('success', 'Devolucion de sobrante registrada.');
    }

    private function normalizeCode(string $code): string
    {
        return Str::upper(trim($code));
    }
}
