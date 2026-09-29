<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryQrMovementController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->canUseInventoryQuickMovement(), 403);

        return Inertia::render('inventory/admin/qr-movement', [
            'inventoryUrl' => route('admin.inventory.index'),
            'items' => InventoryItem::query()
                ->where('active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'description', 'unit', 'current_stock', 'minimum_stock'])
                ->map(fn (InventoryItem $item): array => [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'description' => $item->description,
                    'unit' => $item->unit,
                    'current_stock' => (float) $item->current_stock,
                    'minimum_stock' => (float) $item->minimum_stock,
                    'low_stock' => (float) $item->current_stock <= (float) $item->minimum_stock,
                    'quick_url' => route('inventory.qr.show', ['code' => $item->code]),
                    'movement_store_url' => route('inventory.qr.movements.store', ['code' => $item->code]),
                ]),
            'permissions' => [
                'can_exit' => $request->user()->canRecordInventoryExit(),
            ],
        ]);
    }
}
