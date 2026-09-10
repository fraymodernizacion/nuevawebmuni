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
        Schema::create('complaint_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('complaint_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('requires_description')->default(false);
            $table->boolean('active')->default(true)->index();
            $table->timestamps();

            $table->unique(['complaint_category_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaint_types');
    }
};
