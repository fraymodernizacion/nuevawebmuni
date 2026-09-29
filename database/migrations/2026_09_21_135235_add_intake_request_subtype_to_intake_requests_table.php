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
        Schema::table('intake_requests', function (Blueprint $table) {
            $table->foreignId('intake_request_subtype_id')
                ->nullable()
                ->after('intake_request_type_id')
                ->constrained('intake_request_subtypes')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('intake_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('intake_request_subtype_id');
        });
    }
};
