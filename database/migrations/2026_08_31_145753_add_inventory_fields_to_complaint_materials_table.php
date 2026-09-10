<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('complaint_materials', function (Blueprint $table) {
            $table->foreignId('inventory_item_id')->nullable()->after('complaint_intervention_id')->constrained()->nullOnDelete();
            $table->string('inventory_item_code')->nullable()->after('inventory_item_id');
            $table->string('inventory_item_name')->nullable()->after('inventory_item_code');
            $table->string('inventory_item_unit')->nullable()->after('inventory_item_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaint_materials', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_item_id');
            $table->dropColumn([
                'inventory_item_code',
                'inventory_item_name',
                'inventory_item_unit',
            ]);
        });
    }
};
