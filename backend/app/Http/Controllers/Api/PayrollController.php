<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\PayrollSubmission;
use App\Services\PayrollSnapshotService;
use App\Services\PayrollStateMachine;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    use ApiResponseTrait;

    private PayrollStateMachine $stateMachine;
    private PayrollSnapshotService $snapshotService;

    public function __construct(PayrollStateMachine $stateMachine, PayrollSnapshotService $snapshotService)
    {
        $this->stateMachine = $stateMachine;
        $this->snapshotService = $snapshotService;
    }

    /**
     * OSS-304: Create a new draft payroll for a specific period.
     *
     * POST /api/payroll/draft
     */
    public function createDraft(Request $request): JsonResponse
    {
        $request->validate([
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'period_year'  => ['required', 'integer', 'min:2000'],
        ]);

        $user = $request->user();
        $month = (int) $request->period_month;
        $year = (int) $request->period_year;

        // dump("Request token: " . $request->bearerToken(), "Resolved user ID: " . $user->id);

        // Check for duplicate submission
        $existing = PayrollSubmission::forUser($user->id)
            ->forPeriod($month, $year)
            ->first();

        if ($existing) {
            return $this->errorResponse(
                message: "Anda sudah memiliki pengajuan payroll untuk periode {$month}/{$year}.",
                code: 409
            );
        }

        $submission = PayrollSubmission::create([
            'user_id'      => $user->id,
            'period_month' => $month,
            'period_year'  => $year,
            'status'       => PayrollStateMachine::STATUS_DRAFT,
        ]);

        return $this->successResponse(
            data: $this->formatSubmission($submission),
            message: 'Draft payroll berhasil dibuat.',
            code: 201
        );
    }

    /**
     * OSS-304: Preview recap data that will be included in the snapshot.
     *
     * GET /api/payroll/draft/preview?month=&year=
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year'  => ['required', 'integer', 'min:2000'],
        ]);

        $user = $request->user();
        $month = (int) $request->month;
        $year = (int) $request->year;

        $logbooks = Logbook::forUser($user->id)
            ->forMonth($month, $year)
            ->orderBy('date')
            ->get();

        $totalDuration = $logbooks->sum('duration_seconds');

        $hours = floor($totalDuration / 3600);
        $minutes = floor(($totalDuration % 3600) / 60);
        $seconds = $totalDuration % 60;

        return $this->successResponse(
            data: [
                'period_month' => $month,
                'period_year'  => $year,
                'summary' => [
                    'total_duration_seconds'  => $totalDuration,
                    'total_duration_formatted' => sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds),
                    'total_entries'           => $logbooks->count(),
                ],
                'entries' => $logbooks->map(fn ($l) => [
                    'id'               => $l->id,
                    'date'             => $l->date->format('Y-m-d'),
                    'title'            => $l->title,
                    'description'      => $l->description,
                    'duration_seconds' => $l->duration_seconds,
                    'status'           => $l->status,
                ])->values(),
            ],
            message: 'Preview data recap untuk snapshot payroll.'
        );
    }

    /**
     * OSS-305: Submit payroll — create snapshot + transition draft → submitted.
     *
     * POST /api/payroll/{id}/submit
     */
    public function submit(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $submission = PayrollSubmission::forUser($user->id)->find($id);

        if (! $submission) {
            return $this->errorResponse(message: 'Payroll submission tidak ditemukan.', code: 404);
        }

        // Validate state transition
        try {
            $this->stateMachine->transition($submission->status, PayrollStateMachine::STATUS_SUBMITTED);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse(message: $e->getMessage(), code: 409);
        }

        // Wrap everything in a DB transaction
        DB::beginTransaction();

        try {
            // Create snapshot from current logbook data
            $snapshotResult = $this->snapshotService->createSnapshot($submission);

            // Update submission
            $submission->update([
                'status'                 => PayrollStateMachine::STATUS_SUBMITTED,
                'submitted_at'           => now(),
                'total_duration_seconds' => $snapshotResult['total_duration'],
                'total_entries'          => $snapshotResult['total_entries'],
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse(
                message: 'Gagal submit payroll. Silakan coba lagi.',
                code: 500
            );
        }

        $submission->load('snapshotItems');

        return $this->successResponse(
            data: $this->formatSubmission($submission, includeSnapshot: true),
            message: 'Payroll berhasil disubmit.'
        );
    }

    /**
     * OSS-306: List own payroll submissions.
     *
     * GET /api/payroll
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $submissions = PayrollSubmission::forUser($user->id)
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->get();

        return $this->successResponse(
            data: $submissions->map(fn ($s) => $this->formatSubmission($s)),
            message: 'Daftar payroll berhasil diambil.'
        );
    }

    /**
     * OSS-306: Show payroll detail with snapshot.
     *
     * GET /api/payroll/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Own payroll, or Direktur can view any
        $query = PayrollSubmission::with('snapshotItems');

        if ($user->hasPermission('approve-payroll') || $user->hasRole('superadmin')) {
            $submission = $query->find($id);
        } else {
            $submission = $query->forUser($user->id)->find($id);
        }

        if (! $submission) {
            return $this->errorResponse(message: 'Payroll submission tidak ditemukan.', code: 404);
        }

        return $this->successResponse(
            data: $this->formatSubmission($submission, includeSnapshot: true),
            message: 'Detail payroll berhasil diambil.'
        );
    }

    // ─── Private Helpers ─────────────────────────────────

    /**
     * Format a PayrollSubmission for API response.
     */
    private function formatSubmission(PayrollSubmission $submission, bool $includeSnapshot = false): array
    {
        $data = [
            'id'                     => $submission->id,
            'user_id'                => $submission->user_id,
            'period_month'           => $submission->period_month,
            'period_year'            => $submission->period_year,
            'status'                 => $submission->status,
            'submitted_at'           => $submission->submitted_at?->toIso8601String(),
            'total_duration_seconds' => $submission->total_duration_seconds,
            'total_entries'          => $submission->total_entries,
            'created_at'             => $submission->created_at->toIso8601String(),
            'updated_at'             => $submission->updated_at->toIso8601String(),
        ];

        if ($includeSnapshot && $submission->relationLoaded('snapshotItems')) {
            $data['snapshot_items'] = $submission->snapshotItems->map(fn ($item) => [
                'id'               => $item->id,
                'logbook_id'       => $item->logbook_id,
                'title'            => $item->title,
                'description'      => $item->description,
                'date'             => $item->date->format('Y-m-d'),
                'duration_seconds' => $item->duration_seconds,
                'logbook_status'   => $item->logbook_status,
            ])->values();
        }

        return $data;
    }
}
