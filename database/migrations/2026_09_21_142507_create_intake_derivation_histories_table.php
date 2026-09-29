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
        Schema::create('intake_derivation_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intake_derivation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->string('action')->index();
            $table->text('previous_response')->nullable();
            $table->text('new_response')->nullable();
            $table->timestamp('changed_at')->index();
            $table->timestamp('operator_seen_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intake_derivation_histories');
    }
};
