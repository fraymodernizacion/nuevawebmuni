<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInventoryItemRequest;
use App\Http\Requests\UpdateInventoryItemRequest;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageInventory(), 403);

        $search = $request->string('search')->toString();
        $stockState = $request->string('stock_state')->toString();

        $items = InventoryItem::query()
            ->withCount('movements')
            ->when($search, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('qr_value', 'like', "%{$search}%");
                });
            })
            ->when($stockState === 'low', function ($query): void {
                $query->whereColumn('current_stock', '<=', 'minimum_stock');
            })
            ->when($stockState === 'inactive', fn ($query) => $query->where('active', false))
            ->orderByRaw('CASE WHEN current_stock <= minimum_stock THEN 0 ELSE 1 END')
            ->orderBy('code')
            ->paginate(18)
            ->withQueryString()
            ->through(fn (InventoryItem $item): array => $this->payload($item, false));

        $summary = [
            'total_items' => InventoryItem::count(),
            'active_items' => InventoryItem::where('active', true)->count(),
            'low_stock_items' => InventoryItem::whereColumn('current_stock', '<=', 'minimum_stock')->count(),
            'inactive_items' => InventoryItem::where('active', false)->count(),
            'total_stock' => (float) InventoryItem::sum('current_stock'),
        ];

        return Inertia::render('inventory/admin/index', [
            'items' => $items,
            'filters' => $request->only(['search', 'stock_state']),
            'summary' => $summary,
            'stockStates' => [
                ['value' => 'all', 'label' => 'Todos'],
                ['value' => 'low', 'label' => 'Bajo stock'],
                ['value' => 'inactive', 'label' => 'Inactivos'],
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->canManageInventory(), 403);

        return Inertia::render('inventory/admin/create', [
            'item' => [
                'code' => '',
                'name' => '',
                'description' => '',
                'unit' => 'unidad',
                'current_stock' => '0',
                'minimum_stock' => '0',
                'active' => true,
            ],
        ]);
    }

    public function store(StoreInventoryItemRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $code = Str::upper(trim($validated['code']));

        $item = InventoryItem::create([
            'code' => $code,
            'name' => trim($validated['name']),
            'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
            'unit' => trim($validated['unit']),
            'current_stock' => $validated['current_stock'],
            'minimum_stock' => $validated['minimum_stock'],
            'qr_value' => $code,
            'source_sheet' => 'GESTION GENERAL',
            'source_row' => null,
            'active' => $request->boolean('active'),
        ]);

        return redirect()
            ->route('admin.inventory.show', $item)
            ->with('success', 'Insumo creado.');
    }

    public function show(Request $request, InventoryItem $inventoryItem): Response
    {
        abort_unless($request->user()?->canManageInventory(), 403);

        $inventoryItem->loadCount('movements');
        $inventoryItem->load([
            'movements' => fn ($query) => $query
                ->with([
                    'user:id,name',
                    'complaintIntervention.complaint:id,public_code',
                ])
                ->latest()
                ->limit(12),
        ]);

        return Inertia::render('inventory/admin/show', [
            'item' => $this->payload($inventoryItem),
            'recentMovements' => $inventoryItem->movements->map(fn (InventoryMovement $movement): array => $this->movementPayload($movement))->values(),
        ]);
    }

    public function edit(Request $request, InventoryItem $inventoryItem): Response
    {
        abort_unless($request->user()?->canManageInventory(), 403);

        return Inertia::render('inventory/admin/edit', [
            'item' => $this->payload($inventoryItem, false),
        ]);
    }

    public function update(UpdateInventoryItemRequest $request, InventoryItem $inventoryItem): RedirectResponse
    {
        $validated = $request->validated();
        $code = Str::upper(trim($validated['code']));

        $inventoryItem->update([
            'code' => $code,
            'name' => trim($validated['name']),
            'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
            'unit' => trim($validated['unit']),
            'current_stock' => $validated['current_stock'],
            'minimum_stock' => $validated['minimum_stock'],
            'qr_value' => $code,
            'active' => $request->boolean('active'),
        ]);

        return redirect()
            ->route('admin.inventory.show', $inventoryItem)
            ->with('success', 'Insumo actualizado.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(InventoryItem $item, bool $includeMovements = true): array
    {
        return [
            'id' => $item->id,
            'code' => $item->code,
            'name' => $item->name,
            'description' => $item->description,
            'unit' => $item->unit,
            'current_stock' => (float) $item->current_stock,
            'minimum_stock' => (float) $item->minimum_stock,
            'qr_value' => $item->qr_value,
            'source_sheet' => $item->source_sheet,
            'source_row' => $item->source_row,
            'active' => $item->active,
            'movements_count' => $item->movements_count ?? $item->movements?->count() ?? 0,
            'low_stock' => (float) $item->current_stock <= (float) $item->minimum_stock,
            'created_at' => $item->created_at?->toISOString(),
            'updated_at' => $item->updated_at?->toISOString(),
            'movements' => $includeMovements
                ? $item->movements->map(fn (InventoryMovement $movement): array => $this->movementPayload($movement))->values()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function movementPayload(InventoryMovement $movement): array
    {
        return [
            'id' => $movement->id,
            'movement_type' => $movement->movement_type,
            'quantity' => (float) $movement->quantity,
            'stock_before' => (float) $movement->stock_before,
            'stock_after' => (float) $movement->stock_after,
            'description' => $movement->description,
            'metadata' => $movement->metadata,
            'created_at' => $movement->created_at?->toISOString(),
            'user' => $movement->user,
            'complaint_intervention' => $movement->complaintIntervention?->complaint?->public_code
                ? [
                    'id' => $movement->complaintIntervention->id,
                    'complaint_code' => $movement->complaintIntervention->complaint->public_code,
                ]
                : null,
        ];
    }
}
