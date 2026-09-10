<?php

namespace App\Console\Commands;

use App\Services\Inventory\InventoryExcelImporter;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('inventory:import-excel {path : Ruta al archivo xlsx a importar}')]
#[Description('Importa el inventario desde el Excel base del deposito.')]
class ImportInventoryFromExcel extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(InventoryExcelImporter $importer): int
    {
        $path = (string) $this->argument('path');

        try {
            $result = $importer->import($path);
        } catch (\Throwable $throwable) {
            $this->error($throwable->getMessage());

            return self::FAILURE;
        }

        $this->info("Inventario importado: {$result['items']} insumos, {$result['movements']} movimientos.");

        return self::SUCCESS;
    }
}
