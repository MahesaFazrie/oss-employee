<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkTimer;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimerController extends Controller
{
    use ApiResponseTrait;

    /**
     * Start a new timer.
     */
    public function start(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $timer = DB::transaction(function () use ($user) {
                // Lock to prevent race condition
                $existing = WorkTimer::forUser($user->id)
                    ->running()
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    return null; // Signal conflict
                }

                return WorkTimer::create([
                    'user_id' => $user->id,
                    'started_at' => now(),
                    'status' => 'running',
                ]);
            });

            if ($timer === null) {
                return $this->errorResponse(
                    message: 'Anda sudah memiliki timer yang sedang berjalan.',
                    code: 409
                );
            }

            return $this->successResponse(
                data: [
                    'id' => $timer->id,
                    'started_at' => $timer->started_at->toIso8601String(),
                    'status' => $timer->status,
                ],
                message: 'Timer dimulai.',
                code: 201
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                message: 'Gagal memulai timer.',
                code: 500
            );
        }
    }

    /**
     * Get the active timer for the authenticated user.
     */
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();

        $timer = WorkTimer::forUser($user->id)
            ->running()
            ->first();

        if (! $timer) {
            return $this->successResponse(
                data: null,
                message: 'Tidak ada timer aktif.'
            );
        }

        return $this->successResponse(
            data: [
                'id' => $timer->id,
                'started_at' => $timer->started_at->toIso8601String(),
                'status' => $timer->status,
                'elapsed_seconds' => $timer->calculateDuration(),
            ],
            message: 'Timer aktif ditemukan.'
        );
    }

    /**
     * Stop the active timer.
     */
    public function stop(Request $request): JsonResponse
    {
        $user = $request->user();

        $timer = WorkTimer::forUser($user->id)
            ->running()
            ->first();

        if (! $timer) {
            return $this->errorResponse(
                message: 'Tidak ada timer aktif.',
                code: 404
            );
        }

        $timer->stopped_at = now();
        $timer->duration_seconds = $timer->calculateDuration();
        $timer->status = 'stopped';
        $timer->save();

        return $this->successResponse(
            data: [
                'id' => $timer->id,
                'started_at' => $timer->started_at->toIso8601String(),
                'stopped_at' => $timer->stopped_at->toIso8601String(),
                'duration_seconds' => $timer->duration_seconds,
                'status' => $timer->status,
            ],
            message: 'Timer dihentikan.'
        );
    }

    /**
     * Cancel the active timer.
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();

        $timer = WorkTimer::forUser($user->id)
            ->running()
            ->first();

        if (! $timer) {
            return $this->errorResponse(
                message: 'Tidak ada timer aktif.',
                code: 404
            );
        }

        $timer->stopped_at = now();
        $timer->status = 'cancelled';
        $timer->save();

        return $this->successResponse(
            data: [
                'id' => $timer->id,
                'status' => $timer->status,
            ],
            message: 'Timer dibatalkan.'
        );
    }
}
