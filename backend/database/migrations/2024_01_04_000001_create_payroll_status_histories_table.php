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
        Schema::create('payroll_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_submission_id')->constrained('payroll_submissions')->onDelete('cascade');
            $table->foreignId('changed_by')->constrained('users')->onDelete('cascade'); // User who changed the status
            $table->string('from_status');
            $table->string('to_status');
            $table->text('notes')->nullable(); // Reason for revision/rejection
            $table->timestamps();

            $table->index('payroll_submission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_status_histories');
    }
};
