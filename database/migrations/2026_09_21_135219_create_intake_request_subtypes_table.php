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
        Schema::create('intake_request_subtypes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intake_request_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('default_intake_assistance_type_id')->nullable()->constrained('intake_assistance_types')->nullOnDelete();
            $table->string('slug');
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('cost_information')->nullable();
            $table->string('result_information')->nullable();
            $table->json('requirements')->nullable();
            $table->json('schema')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->string('publication_status')->default('published')->index();
            $table->boolean('active')->default(true)->index();
            $table->timestamps();

            $table->unique(['intake_request_type_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('intake_request_subtypes');
    }
};
