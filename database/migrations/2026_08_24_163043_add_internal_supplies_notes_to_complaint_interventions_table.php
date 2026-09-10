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
        Schema::table('complaint_interventions', function (Blueprint $table) {
            $table->text('internal_supplies_notes')->nullable()->after('observations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaint_interventions', function (Blueprint $table) {
            $table->dropColumn('internal_supplies_notes');
        });
    }
};
