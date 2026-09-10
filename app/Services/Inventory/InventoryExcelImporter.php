<?php

namespace App\Services\Inventory;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use DOMDocument;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class InventoryExcelImporter
{
    /**
     * @return array{items:int,movements:int}
     */
    public function import(string $path): array
    {
        $this->ensureFileExists($path);

        $workbook = $this->readWorkbook($path);
        $sheetPath = $workbook['sheets']['CONTROL DE INVENTARIO'] ?? null;

        if ($sheetPath === null) {
            throw new RuntimeException('No se encontro la hoja "CONTROL DE INVENTARIO".');
        }

        $rows = $this->readWorksheetRows($path, $sheetPath, $workbook['sharedStrings']);

        $itemsImported = 0;
        $movementsImported = 0;

        DB::transaction(function () use ($rows, $path, &$itemsImported, &$movementsImported): void {
            foreach ($rows as $rowNumber => $row) {
                if ($rowNumber < 6) {
                    continue;
                }

                $code = $this->normalizeText($row['A'] ?? null);
                $name = $this->normalizeText($row['B'] ?? null);

                if ($code === '' && $name === '') {
                    continue;
                }

                if ($code === '' || $name === '') {
                    continue;
                }

                $currentStock = $this->number($row['F'] ?? $row['C'] ?? null);
                $minimumStock = $this->number($row['G'] ?? null);

                $item = InventoryItem::query()->firstOrNew(['code' => $code]);
                $previousStock = (float) ($item->current_stock ?? 0);

                $item->fill([
                    'name' => $name,
                    'description' => null,
                    'unit' => 'unidad',
                    'current_stock' => $currentStock,
                    'minimum_stock' => $minimumStock,
                    'qr_value' => $code,
                    'source_sheet' => 'CONTROL DE INVENTARIO',
                    'source_row' => $rowNumber,
                    'active' => true,
                ]);

                $item->save();
                $itemsImported++;

                if (abs($currentStock - $previousStock) < 0.0001) {
                    continue;
                }

                InventoryMovement::create([
                    'inventory_item_id' => $item->id,
                    'movement_type' => $item->wasRecentlyCreated ? 'initial_import' : 'import_adjustment',
                    'quantity' => abs($currentStock - $previousStock),
                    'stock_before' => $previousStock,
                    'stock_after' => $currentStock,
                    'description' => 'Importado desde Excel',
                    'metadata' => [
                        'source_file' => basename($path),
                        'sheet' => 'CONTROL DE INVENTARIO',
                        'row' => $rowNumber,
                    ],
                ]);
                $movementsImported++;
            }
        });

        return [
            'items' => $itemsImported,
            'movements' => $movementsImported,
        ];
    }

    private function ensureFileExists(string $path): void
    {
        if (! is_file($path)) {
            throw new RuntimeException("No se encontro el archivo: {$path}");
        }
    }

    /**
     * @return array{sharedStrings: array<int, string>, sheets: array<string, string>}
     */
    private function readWorkbook(string $path): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw new RuntimeException('No se pudo abrir el archivo Excel.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetTargets = $this->readSheetTargets($zip);

        $zip->close();

        return [
            'sharedStrings' => $sharedStrings,
            'sheets' => $sheetTargets,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function readSharedStrings(ZipArchive $zip): array
    {
        if ($zip->locateName('xl/sharedStrings.xml') === false) {
            return [];
        }

        $document = new DOMDocument;
        $document->loadXML($zip->getFromName('xl/sharedStrings.xml'));

        $strings = [];

        foreach ($document->getElementsByTagName('si') as $sharedString) {
            $text = '';

            foreach ($sharedString->getElementsByTagName('t') as $node) {
                $text .= $node->nodeValue ?? '';
            }

            $strings[] = $text;
        }

        return $strings;
    }

    /**
     * @return array<string, string>
     */
    private function readSheetTargets(ZipArchive $zip): array
    {
        $workbookDocument = new DOMDocument;
        $workbookDocument->loadXML($this->zipEntryContents($zip, 'xl/workbook.xml'));

        $relationshipsDocument = new DOMDocument;
        $relationshipsDocument->loadXML($this->zipEntryContents($zip, 'xl/_rels/workbook.xml.rels'));

        $workbookXpath = new \DOMXPath($workbookDocument);
        $workbookXpath->registerNamespace('main', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $workbookXpath->registerNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');

        $relationshipsXpath = new \DOMXPath($relationshipsDocument);
        $relationshipsXpath->registerNamespace('rel', 'http://schemas.openxmlformats.org/package/2006/relationships');

        $relationshipMap = [];
        foreach ($relationshipsXpath->query('/rel:Relationships/rel:Relationship') as $relationship) {
            if (! $relationship instanceof \DOMElement) {
                continue;
            }

            $relationshipMap[$relationship->getAttribute('Id')] = $relationship->getAttribute('Target');
        }

        $sheetTargets = [];
        foreach ($workbookXpath->query('/main:workbook/main:sheets/main:sheet') as $sheet) {
            if (! $sheet instanceof \DOMElement) {
                continue;
            }

            $name = $sheet->getAttribute('name');
            $relationId = $sheet->getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
            $target = $relationshipMap[$relationId] ?? null;

            if ($name === '' || $target === null || $target === '') {
                continue;
            }

            $sheetTargets[$name] = $this->normalizeZipPath('xl/'.$target);
        }

        return $sheetTargets;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readWorksheetRows(string $path, string $sheetPath, array $sharedStrings): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw new RuntimeException('No se pudo abrir el archivo Excel.');
        }

        $xml = $this->xmlFromZip($zip, $sheetPath);
        $zip->close();

        $rows = [];

        foreach ($xml->sheetData->row as $row) {
            $rowNumber = (int) $row['r'];
            $cells = [];

            foreach ($row->c as $cell) {
                $reference = (string) $cell['r'];
                $column = $this->columnFromReference($reference);
                $cells[$column] = $this->cellValue($cell, $sharedStrings);
            }

            $rows[$rowNumber] = $cells;
        }

        ksort($rows);

        return $rows;
    }

    private function xmlFromZip(ZipArchive $zip, string $path): SimpleXMLElement
    {
        $contents = $this->zipEntryContents($zip, $path);

        $xml = simplexml_load_string($contents);

        if (! $xml instanceof SimpleXMLElement) {
            throw new RuntimeException("No se pudo interpretar {$path}.");
        }

        return $xml;
    }

    private function zipEntryContents(ZipArchive $zip, string $path): string
    {
        $contents = $zip->getFromName($path);

        if ($contents === false) {
            throw new RuntimeException("No se pudo leer {$path}.");
        }

        return $contents;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     */
    private function cellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        $type = (string) ($cell['t'] ?? '');
        $value = (string) ($cell->v ?? '');

        return match ($type) {
            's' => $sharedStrings[(int) $value] ?? '',
            'inlineStr' => $this->inlineStringValue($cell),
            'b' => $value === '1' ? '1' : '0',
            default => $value,
        };
    }

    private function inlineStringValue(SimpleXMLElement $cell): string
    {
        if (! isset($cell->is)) {
            return '';
        }

        $value = '';

        foreach ($cell->is->t as $node) {
            $value .= (string) $node;
        }

        return $value;
    }

    private function columnFromReference(string $reference): string
    {
        preg_match('/^[A-Z]+/', $reference, $matches);

        return $matches[0] ?? $reference;
    }

    private function normalizeText(mixed $value): string
    {
        return trim((string) $value);
    }

    private function number(mixed $value): float
    {
        $text = trim(str_replace(',', '.', (string) $value));

        if ($text === '') {
            return 0.0;
        }

        return (float) $text;
    }

    private function normalizeZipPath(string $path): string
    {
        $parts = [];

        foreach (explode('/', $path) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }

            if ($part === '..') {
                array_pop($parts);

                continue;
            }

            $parts[] = $part;
        }

        return implode('/', $parts);
    }
}
