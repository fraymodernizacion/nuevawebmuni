<?php

namespace App\Services\Inventory;

use App\Models\InventoryItem;
use Illuminate\Support\Str;

class GenerateInventoryItemCode
{
    public function handle(string $categoryCode): string
    {
        $lastNumber = InventoryItem::query()
            ->where('code', 'like', "{$categoryCode}-%")
            ->lockForUpdate()
            ->pluck('code')
            ->map(fn (string $code): int => $this->sequenceNumber($code, $categoryCode))
            ->max() ?? 0;

        return sprintf('%s-%03d', $categoryCode, $lastNumber + 1);
    }

    private function sequenceNumber(string $code, string $categoryCode): int
    {
        $suffix = Str::of($code)->after("{$categoryCode}-")->toString();

        return ctype_digit($suffix) ? (int) $suffix : 0;
    }
}
