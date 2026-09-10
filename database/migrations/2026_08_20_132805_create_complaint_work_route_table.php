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
        Schema::create('complaint_work_route', function (Blueprint $table) {
            $table->foreignId('work_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('complaint_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('route_order')->default(0);
            $table->timestamp('added_at')->useCurrent();
            $table->timestamps();

            $table->primary(['work_route_id', 'complaint_id']);
            $table->index(['work_route_id', 'route_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaint_work_route');
    }
};
