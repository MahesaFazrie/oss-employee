<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * OSS-606: Performance Index Verification
 *
 * Add missing indexes on columns frequently used for filtering/joining.
 * These indexes improve query performance on dashboard, list, and filter endpoints.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Logbooks: index status, user+date combo, verification_status
        Schema::table('logbooks', function (Blueprint $table) {
            $table->index('verification_status', 'idx_logbooks_verification_status');
            $table->index(['user_id', 'date'], 'idx_logbooks_user_date');
        });

        // Work Timers: index status for active timer lookup
        Schema::table('work_timers', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_work_timers_user_status');
        });

        // Payroll Submissions: index status, user+period combo
        Schema::table('payroll_submissions', function (Blueprint $table) {
            $table->index('status', 'idx_payroll_submissions_status');
            $table->index(['user_id', 'period_year', 'period_month'], 'idx_payroll_submissions_user_period');
        });

        // Payroll Status Histories: index for history lookup
        Schema::table('payroll_status_histories', function (Blueprint $table) {
            $table->index('payroll_submission_id', 'idx_payroll_status_histories_submission');
        });

        // Audit Logs: index for filtering
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('action', 'idx_audit_logs_action');
            $table->index('created_at', 'idx_audit_logs_created_at');
        });

        // Users: index status for dashboard query
        Schema::table('users', function (Blueprint $table) {
            $table->index('status', 'idx_users_status');
        });
    }

    public function down(): void
    {
        Schema::table('logbooks', function (Blueprint $table) {
            $table->dropIndex('idx_logbooks_verification_status');
            $table->dropIndex('idx_logbooks_user_date');
        });
        Schema::table('work_timers', function (Blueprint $table) {
            $table->dropIndex('idx_work_timers_user_status');
        });
        Schema::table('payroll_submissions', function (Blueprint $table) {
            $table->dropIndex('idx_payroll_submissions_status');
            $table->dropIndex('idx_payroll_submissions_user_period');
        });
        Schema::table('payroll_status_histories', function (Blueprint $table) {
            $table->dropIndex('idx_payroll_status_histories_submission');
        });
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_action');
            $table->dropIndex('idx_audit_logs_created_at');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_status');
        });
    }
};
