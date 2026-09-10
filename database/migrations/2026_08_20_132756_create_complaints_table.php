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
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('public_code')->unique();
            $table->foreignId('complaint_category_id')->constrained();
            $table->foreignId('complaint_type_id')->constrained();
            $table->foreignId('locality_id')->constrained();
            $table->foreignId('operational_zone_id')->constrained();
            $table->foreignId('assigned_crew_id')->nullable()->constrained('crews')->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('street')->nullable();
            $table->string('street_number')->nullable();
            $table->string('neighborhood')->nullable();
            $table->string('location_reference')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('location_needs_verification')->default(false)->index();
            $table->text('description')->nullable();
            $table->string('other_problem_description')->nullable();
            $table->string('current_status')->default('new')->index();
            $table->string('priority')->default('normal')->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->timestamp('closed_at')->nullable()->index();
            $table->timestamps();

            $table->index(['current_status', 'created_at']);
            $table->index(['operational_zone_id', 'current_status']);
            $table->index(['locality_id', 'current_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
