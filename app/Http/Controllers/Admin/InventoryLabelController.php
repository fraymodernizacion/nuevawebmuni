<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryLabelController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageInventory(), 403);

        $search = $request->string('search')->toString();

        $items = InventoryItem::query()
            ->when($search, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->where('active', true)
            ->orderBy('code')
            ->limit(120)
            ->get()
            ->map(fn (InventoryItem $item): array => $this->itemPayload($item));

        return Inertia::render('inventory/labels/index', [
            'items' => $items,
            'filters' => ['search' => $search],
            'indexUrl' => route('admin.inventory.labels.index'),
            'inventoryUrl' => route('admin.inventory.index'),
            'printUrl' => route('admin.inventory.labels.print'),
        ]);
    }

    public function printBatch(Request $request): Response
    {
        abort_unless($request->user()?->canManageInventory(), 403);

        $selectedQuantities = collect($request->query('items', []))
            ->mapWithKeys(fn (mixed $quantity, string|int $id): array => [(int) $id => max(0, min(99, (int) $quantity))])
            ->filter(fn (int $quantity): bool => $quantity > 0);

        $items = InventoryItem::query()
            ->whereKey($selectedQuantities->keys())
            ->orderBy('code')
            ->get()
            ->map(fn (InventoryItem $item): array => [
                ...$this->itemPayload($item),
                'quantity' => $selectedQuantities->get($item->id, 1),
                'qr_svg' => $this->qrSvg(route('inventory.qr.show', ['code' => $item->code])),
            ])
            ->values();

        $labels = $items
            ->flatMap(fn (array $item): array => array_fill(0, $item['quantity'], $item))
            ->values();

        return Inertia::render('inventory/labels/print', [
            'items' => $items,
            'labels' => $labels,
            'totalLabels' => $labels->count(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function itemPayload(InventoryItem $item): array
    {
        return [
            'id' => $item->id,
            'code' => $item->code,
            'name' => $item->name,
            'unit' => $item->unit,
            'current_stock' => (float) $item->current_stock,
            'minimum_stock' => (float) $item->minimum_stock,
            'quick_url' => route('inventory.qr.show', ['code' => $item->code]),
        ];
    }

    private function qrSvg(string $url): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(320, 2),
            new SvgImageBackEnd,
        );

        return (new Writer($renderer))->writeString($url, 'UTF-8', ErrorCorrectionLevel::Q());
    }
}
