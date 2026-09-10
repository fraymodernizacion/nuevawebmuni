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
        Schema::create('intake_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intake_request_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('public_code')->unique();
            $table->string('status')->default('received')->index();
            $table->string('priority')->default('normal')->index();
            $table->string('area')->nullable()->index();
            $table->string('source')->default('web')->index();
            $table->string('applicant_name');
            $table->string('applicant_dni')->nullable();
            $table->string('applicant_phone');
            $table->string('applicant_email')->nullable();
            $table->string('applicant_address')->nullable();
            $table->string('subject');
            $table->text('summary');
            $table->json('payload')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamp('finished_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intake_requests');
    }
};
