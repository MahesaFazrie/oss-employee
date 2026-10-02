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
        Schema::create('payroll_snapshot_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_submission_id')->constrained('payroll_submissions')->onDelete('cascade');
            $table->unsignedBigInteger('logbook_id'); // Reference only, NOT a foreign key — snapshot is independent
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('date');
            $table->integer('duration_seconds');
            $table->string('logbook_status'); // Status of the logbook at time of snapshot
            $table->timestamps();

            $table->index('payroll_submission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_snapshot_items');
    }
};
