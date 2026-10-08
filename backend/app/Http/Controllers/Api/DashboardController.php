<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\PayrollSubmission;
use App\Models\User;
use App\Models\WorkTimer;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponseTrait;

    /**
     * OSS-504: Employee dashboard — summary for the logged-in karyawan.
     *
     * GET /api/dashboard/employee
     */
    public function employee(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = Carbon::now();
        $currentMonth = $now->month;
        $currentYear = $now->year;

        // 1. Active timer
        $activeTimer = WorkTimer::where('user_id', $user->id)
            ->where('status', 'running')
            ->first();

        // 2. Total hours this month
        $totalDurationThisMonth = Logbook::forUser($user->id)
            ->forMonth($currentMonth, $currentYear)
            ->sum('duration_seconds');

        // 3. Latest payroll status
        $latestPayroll = PayrollSubmission::forUser($user->id)
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->first();

        // 4. Logbooks needing revision
        $logbooksNeedingRevision = Logbook::forUser($user->id)
            ->verificationStatus('revision_requested')
            ->count();

        // 5. Logbook count this month
        $logbookCountThisMonth = Logbook::forUser($user->id)
            ->forMonth($currentMonth, $currentYear)
            ->count();

        return $this->successResponse(
            data: [
                'active_timer' => $activeTimer ? [
                    'id'         => $activeTimer->id,
                    'started_at' => $activeTimer->started_at,
                    'elapsed'    => Carbon::parse($activeTimer->started_at)->diffInSeconds($now),
                ] : null,
                'current_month' => [
                    'month'                  => $currentMonth,
                    'year'                   => $currentYear,
                    'total_duration_seconds' => (int) $totalDurationThisMonth,
                    'total_hours'            => round($totalDurationThisMonth / 3600, 1),
                    'logbook_count'          => $logbookCountThisMonth,
                ],
                'latest_payroll' => $latestPayroll ? [
                    'id'           => $latestPayroll->id,
                    'period_month' => $latestPayroll->period_month,
                    'period_year'  => $latestPayroll->period_year,
                    'status'       => $latestPayroll->status,
                ] : null,
                'logbooks_needing_revision' => $logbooksNeedingRevision,
            ],
            message: 'Dashboard karyawan berhasil diambil.'
        );
    }

    /**
     * OSS-506: Director dashboard — summary across all employees.
     *
     * GET /api/dashboard/director
     */
    public function director(Request $request): JsonResponse
    {
        $now = Carbon::now();

        // 1. Logbooks pending review
        $logbooksPendingReview = Logbook::verificationStatus('pending')->count();

        // 2. Payrolls pending approval (submitted status)
        $payrollsPendingApproval = PayrollSubmission::where('status', 'submitted')->count();

        // 3. Total active employees
        $totalActiveEmployees = User::where('status', 'active')->count();

        // 4. Payrolls pending processing (approved but not yet processed)
        $payrollsPendingProcessing = PayrollSubmission::where('status', 'approved')->count();

        // 5. Monthly work hours chart (last 6 months)
        $monthlyWorkHours = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $month = $date->month;
            $year = $date->year;

            $totalSeconds = Logbook::forMonth($month, $year)->sum('duration_seconds');

            $monthlyWorkHours[] = [
                'month'                  => $month,
                'year'                   => $year,
                'label'                  => $date->translatedFormat('M Y'),
                'total_duration_seconds' => (int) $totalSeconds,
                'total_hours'            => round($totalSeconds / 3600, 1),
            ];
        }

        // 6. Recent activity (latest 5 payroll submissions)
        $recentPayrolls = PayrollSubmission::with('user:id,name')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'user'         => ['id' => $p->user->id, 'name' => $p->user->name],
                'period_month' => $p->period_month,
                'period_year'  => $p->period_year,
                'status'       => $p->status,
                'created_at'   => $p->created_at->toIso8601String(),
            ]);

        return $this->successResponse(
            data: [
                'logbooks_pending_review'    => $logbooksPendingReview,
                'payrolls_pending_approval'  => $payrollsPendingApproval,
                'payrolls_pending_processing' => $payrollsPendingProcessing,
                'total_active_employees'     => $totalActiveEmployees,
                'monthly_work_hours'         => $monthlyWorkHours,
                'recent_payrolls'            => $recentPayrolls,
            ],
            message: 'Dashboard direktur berhasil diambil.'
        );
    }
}
