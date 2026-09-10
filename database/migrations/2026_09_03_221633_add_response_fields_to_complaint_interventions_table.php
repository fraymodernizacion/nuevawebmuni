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
        Schema::table('complaint_interventions', function (Blueprint $table): void {
            $table->string('response_code')->nullable()->after('status')->index();
            $table->text('citizen_message')->nullable()->after('response_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaint_interventions', function (Blueprint $table): void {
            $table->dropColumn(['response_code', 'citizen_message']);
        });
    }
};
