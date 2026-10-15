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
        Schema::create('logbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('work_timer_id')->nullable()->unique()->constrained('work_timers')->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('date');
            $table->integer('duration_seconds');
            $table->string('status')->default('draft'); // draft, submitted
            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logbooks');
    }
};
