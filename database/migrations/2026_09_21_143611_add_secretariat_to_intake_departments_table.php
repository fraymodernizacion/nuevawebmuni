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
        Schema::table('intake_departments', function (Blueprint $table) {
            $table->string('secretariat')->nullable()->after('description')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intake_departments', function (Blueprint $table) {
            $table->dropColumn('secretariat');
        });
    }
};
