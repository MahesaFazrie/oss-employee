<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('work_timers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('stopped_at')->nullable();
            $table->string('status')->default('running'); // running, stopped, cancelled
            $table->integer('duration_seconds')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        // Partial unique index for PostgreSQL — ensures only one running timer per user
        // This won't run on SQLite (test env) but provides DB-level safety in production
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                CREATE UNIQUE INDEX idx_one_running_timer_per_user
                ON work_timers (user_id)
                WHERE status = 'running'
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_timers');
    }
};
