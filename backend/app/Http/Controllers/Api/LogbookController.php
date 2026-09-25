<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\WorkTimer;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogbookController extends Controller
{
    use ApiResponseTrait;

    /**
     * List logbooks for the authenticated user (with optional month/year filter).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Logbook::forUser($user->id)->with('workTimer');

        if ($request->filled('month') && $request->filled('year')) {
            $query->forMonth((int) $request->month, (int) $request->year);
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        $logbooks = $query->orderBy('date', 'desc')->get();

        return $this->successResponse(
            data: $logbooks,
            message: 'Logbooks retrieved successfully.'
        );
    }

    /**
     * Create a new logbook entry.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'work_timer_id' => ['nullable', 'integer', 'exists:work_timers,id'],
            'duration_seconds' => ['nullable', 'integer', 'min:1'],
        ]);

        // Either work_timer_id or duration_seconds must be provided
        if (! $request->work_timer_id && ! $request->duration_seconds) {
            return $this->errorResponse(
                message: 'Harus menyertakan work_timer_id atau duration_seconds.',
                code: 422
            );
        }

        $durationSeconds = $request->duration_seconds;

        // If using a work timer, validate ownership and status
        if ($request->work_timer_id) {
            $timer = WorkTimer::find($request->work_timer_id);

            if ($timer->user_id !== $user->id) {
                return $this->errorResponse(
                    message: 'Timer bukan milik Anda.',
                    code: 403
                );
            }

            if (! $timer->isStopped()) {
                return $this->errorResponse(
                    message: 'Timer harus dihentikan terlebih dahulu.',
                    code: 400
                );
            }

            // Check if timer is already used by another logbook
            $existingLogbook = Logbook::where('work_timer_id', $request->work_timer_id)->first();
            if ($existingLogbook) {
                return $this->errorResponse(
                    message: 'Timer sudah digunakan di logbook lain.',
                    code: 409
                );
            }

            $durationSeconds = $timer->duration_seconds;
        }

        $logbook = Logbook::create([
            'user_id' => $user->id,
            'work_timer_id' => $request->work_timer_id,
            'title' => $request->title,
            'description' => $request->description,
            'date' => $request->date,
            'duration_seconds' => $durationSeconds,
            'status' => 'draft',
        ]);

        $logbook->load('workTimer');

        return $this->successResponse(
            data: $logbook,
            message: 'Logbook berhasil dibuat.',
            code: 201
        );
    }

    /**
     * Show logbook detail.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $logbook = Logbook::with('workTimer', 'user')->find($id);

        if (! $logbook) {
            return $this->errorResponse(message: 'Logbook not found.', code: 404);
        }

        // Owner or user with view-all-logbook permission
        if ($logbook->user_id !== $user->id && ! $user->hasPermission('view-all-logbook')) {
            return $this->errorResponse(message: 'Forbidden.', code: 403);
        }

        return $this->successResponse(
            data: $logbook,
            message: 'Logbook detail retrieved successfully.'
        );
    }

    /**
     * Update logbook (only draft status).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $logbook = Logbook::find($id);

        if (! $logbook) {
            return $this->errorResponse(message: 'Logbook not found.', code: 404);
        }

        if ($logbook->user_id !== $user->id) {
            return $this->errorResponse(message: 'Forbidden.', code: 403);
        }

        if (! $logbook->isDraft()) {
            return $this->errorResponse(
                message: 'Logbook yang sudah disubmit tidak dapat diedit.',
                code: 400
            );
        }

        $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_seconds' => ['sometimes', 'integer', 'min:1'],
        ]);

        $logbook->fill($request->only(['title', 'description', 'duration_seconds']));
        $logbook->save();

        return $this->successResponse(
            data: $logbook,
            message: 'Logbook berhasil diupdate.'
        );
    }
}
