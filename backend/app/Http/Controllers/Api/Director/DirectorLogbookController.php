<?php

namespace App\Http\Controllers\Api\Director;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\LogbookComment;
use App\Services\LogbookVerificationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectorLogbookController extends Controller
{
    use ApiResponseTrait;

    private LogbookVerificationService $verificationService;

    public function __construct(LogbookVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * OSS-403: List logbooks for review (filterable by verification_status).
     *
     * GET /api/director/logbooks?status=pending
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'string', 'in:pending,approved,revision_requested'],
        ]);

        $query = Logbook::with('user:id,name,email');

        if ($request->filled('status')) {
            $query->verificationStatus($request->status);
        }

        $logbooks = $query->orderByDesc('date')->get();

        return $this->successResponse(
            data: $logbooks->map(fn ($l) => [
                'id'                  => $l->id,
                'user'                => [
                    'id'   => $l->user->id,
                    'name' => $l->user->name,
                ],
                'title'               => $l->title,
                'description'         => $l->description,
                'date'                => $l->date->format('Y-m-d'),
                'duration_seconds'    => $l->duration_seconds,
                'status'              => $l->status,
                'verification_status' => $l->verification_status,
                'created_at'          => $l->created_at->toIso8601String(),
            ]),
            message: 'Daftar logbook untuk review berhasil diambil.'
        );
    }

    /**
     * OSS-403: Approve a logbook.
     *
     * POST /api/director/logbooks/{id}/approve
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $logbook = Logbook::find($id);

        if (! $logbook) {
            return $this->errorResponse(message: 'Logbook tidak ditemukan.', code: 404);
        }

        try {
            $this->verificationService->transition(
                $logbook,
                LogbookVerificationService::STATUS_APPROVED,
                $request->user()->id,
                $request->notes
            );

            // Trigger Notification
            $logbook->user->notify(new \App\Notifications\LogbookReviewedNotification($logbook, 'approved'));

        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse(message: $e->getMessage(), code: 409);
        }

        return $this->successResponse(
            data: [
                'id'                  => $logbook->id,
                'verification_status' => $logbook->verification_status,
            ],
            message: 'Logbook berhasil diapprove.'
        );
    }

    /**
     * OSS-403: Request revision on a logbook — must include a comment.
     *
     * POST /api/director/logbooks/{id}/request-revision
     */
    public function requestRevision(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $logbook = Logbook::with('user')->find($id);

        if (! $logbook) {
            return $this->errorResponse(message: 'Logbook tidak ditemukan.', code: 404);
        }

        try {
            $this->verificationService->transition(
                $logbook,
                LogbookVerificationService::STATUS_REVISION_REQUESTED,
                $request->user()->id,
                $request->comment
            );

            // Trigger Notification
            $logbook->user->notify(new \App\Notifications\LogbookReviewedNotification($logbook, 'revision_requested', $request->comment));

        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse(message: $e->getMessage(), code: 409);
        }

        // Also create a comment so the karyawan can see the feedback
        LogbookComment::create([
            'logbook_id' => $logbook->id,
            'user_id'    => $request->user()->id,
            'comment'    => $request->comment,
        ]);

        return $this->successResponse(
            data: [
                'id'                  => $logbook->id,
                'verification_status' => $logbook->verification_status,
            ],
            message: 'Permintaan revisi berhasil dikirim.'
        );
    }
}
