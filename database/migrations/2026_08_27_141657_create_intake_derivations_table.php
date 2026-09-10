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
        Schema::create('intake_derivations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intake_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('intake_department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('intake_assistance_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('last_updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending')->index();
            $table->text('operator_note')->nullable();
            $table->text('department_response')->nullable();
            $table->timestamp('accepted_at')->nullable()->index();
            $table->timestamp('completed_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['intake_request_id', 'intake_department_id', 'intake_assistance_type_id'], 'intake_derivation_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intake_derivations');
    }
};
