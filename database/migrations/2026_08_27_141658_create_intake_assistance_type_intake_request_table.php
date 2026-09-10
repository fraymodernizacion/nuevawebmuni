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
        Schema::create('intake_assistance_type_intake_request', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intake_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('intake_assistance_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['intake_request_id', 'intake_assistance_type_id'], 'intake_request_assistance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intake_assistance_type_intake_request');
    }
};
