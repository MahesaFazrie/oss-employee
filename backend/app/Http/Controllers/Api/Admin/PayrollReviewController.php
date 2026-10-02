<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayrollStatusHistory;
use App\Models\PayrollSubmission;
use App\Services\PayrollStateMachine;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PayrollReviewController extends Controller
{
    use ApiResponseTrait;

    private PayrollStateMachine $stateMachine;

    public function __construct(PayrollStateMachine $stateMachine)
    {
        $this->stateMachine = $stateMachine;
    }

    /**
     * List all payroll submissions (for Direktur / Superadmin).
     *
     * GET /api/admin/payroll?status=submitted
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'string', Rule::in(PayrollStateMachine::allStatuses())],
        ]);

        $query = PayrollSubmission::with('user:id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $submissions = $query
            ->orderByDesc('submitted_at')
            ->orderByDesc('created_at')
            ->get();

        return $this->successResponse(
            data: $submissions->map(fn ($s) => $this->formatSubmission($s)),
            message: 'Daftar payroll berhasil diambil.'
        );
    }

    /**
     * Show payroll detail with snapshot items and status history.
     *
     * GET /api/admin/payroll/{id}
     */
    public function show(int $id): JsonResponse
    {
        $submission = PayrollSubmission::with(['snapshotItems', 'statusHistories.changedByUser:id,name', 'user:id,name,email'])
            ->find($id);

        if (! $submission) {
            return $this->errorResponse(message: 'Payroll submission tidak ditemukan.', code: 404);
        }

        return $this->successResponse(
            data: $this->formatSubmission($submission, includeDetails: true),
            message: 'Detail payroll berhasil diambil.'
        );
    }

    /**
     * Review a payroll submission — approve, reject, or request revision.
     *
     * POST /api/admin/payroll/{id}/review
     *
     * Step 1: submitted → under_review (automatic)
     * Step 2: under_review → approve / reject / request_revision
     */
    public function review(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'action' => ['required', 'string', Rule::in(['approve', 'reject', 'request_revision'])],
            'notes'  => ['nullable', 'string', 'max:1000'],
        ]);

        $reviewer = $request->user();
        $submission = PayrollSubmission::find($id);

        if (! $submission) {
            return $this->errorResponse(message: 'Payroll submission tidak ditemukan.', code: 404);
        }

        $action = $request->action;

        // Map action to target status
        $targetStatus = match ($action) {
            'approve'          => PayrollStateMachine::STATUS_APPROVED,
            'reject'           => PayrollStateMachine::STATUS_REJECTED,
            'request_revision' => PayrollStateMachine::STATUS_REVISION_REQUESTED,
        };

        DB::beginTransaction();

        try {
            // If status is 'submitted', auto-transition to 'under_review' first
            if ($submission->status === PayrollStateMachine::STATUS_SUBMITTED) {
                $this->stateMachine->transition(
                    $submission->status,
                    PayrollStateMachine::STATUS_UNDER_REVIEW
                );

                PayrollStatusHistory::create([
                    'payroll_submission_id' => $submission->id,
                    'changed_by'            => $reviewer->id,
                    'from_status'           => $submission->status,
                    'to_status'             => PayrollStateMachine::STATUS_UNDER_REVIEW,
                    'notes'                 => null,
                ]);

                $submission->update(['status' => PayrollStateMachine::STATUS_UNDER_REVIEW]);
            }

            // Now transition from under_review to target status
            $this->stateMachine->transition($submission->status, $targetStatus);

            PayrollStatusHistory::create([
                'payroll_submission_id' => $submission->id,
                'changed_by'            => $reviewer->id,
                'from_status'           => $submission->status,
                'to_status'             => $targetStatus,
                'notes'                 => $request->notes,
            ]);

            $submission->update(['status' => $targetStatus]);

            DB::commit();
        } catch (\InvalidArgumentException $e) {
            DB::rollBack();
            return $this->errorResponse(message: $e->getMessage(), code: 409);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse(
                message: 'Gagal mereview payroll. Silakan coba lagi.',
                code: 500
            );
        }

        $submission->load(['statusHistories.changedByUser:id,name', 'user:id,name,email']);

        return $this->successResponse(
            data: $this->formatSubmission($submission, includeDetails: true),
            message: match ($action) {
                'approve'          => 'Payroll berhasil diapprove.',
                'reject'           => 'Payroll ditolak.',
                'request_revision' => 'Permintaan revisi telah dikirim.',
            }
        );
    }

    // ─── Private Helpers ─────────────────────────────────

    private function formatSubmission(PayrollSubmission $submission, bool $includeDetails = false): array
    {
        $data = [
            'id'                     => $submission->id,
            'user_id'                => $submission->user_id,
            'user'                   => $submission->relationLoaded('user') ? [
                'id'    => $submission->user->id,
                'name'  => $submission->user->name,
                'email' => $submission->user->email,
            ] : null,
            'period_month'           => $submission->period_month,
            'period_year'            => $submission->period_year,
            'status'                 => $submission->status,
            'submitted_at'           => $submission->submitted_at?->toIso8601String(),
            'total_duration_seconds' => $submission->total_duration_seconds,
            'total_entries'          => $submission->total_entries,
            'created_at'             => $submission->created_at->toIso8601String(),
            'updated_at'             => $submission->updated_at->toIso8601String(),
        ];

        if ($includeDetails) {
            if ($submission->relationLoaded('snapshotItems')) {
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

            if ($submission->relationLoaded('statusHistories')) {
                $data['status_history'] = $submission->statusHistories->map(fn ($h) => [
                    'id'          => $h->id,
                    'from_status' => $h->from_status,
                    'to_status'   => $h->to_status,
                    'notes'       => $h->notes,
                    'changed_by'  => $h->relationLoaded('changedByUser') ? [
                        'id'   => $h->changedByUser->id,
                        'name' => $h->changedByUser->name,
                    ] : null,
                    'created_at'  => $h->created_at->toIso8601String(),
                ])->values();
            }
        }

        return $data;
    }
}
