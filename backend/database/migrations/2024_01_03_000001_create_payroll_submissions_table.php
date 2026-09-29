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
        Schema::create('payroll_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('period_month'); // 1-12
            $table->integer('period_year');  // e.g. 2026
            $table->string('status')->default('draft'); // draft, submitted, under_review, revision_requested, approved, rejected, processed
            $table->timestamp('submitted_at')->nullable();
            $table->integer('total_duration_seconds')->default(0);
            $table->integer('total_entries')->default(0);
            $table->timestamps();

            // One submission per employee per period
            $table->unique(['user_id', 'period_month', 'period_year'], 'unique_user_period');
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_submissions');
    }
};
