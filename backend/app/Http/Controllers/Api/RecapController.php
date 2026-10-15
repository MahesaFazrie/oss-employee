<?php

namespace App\Http\Controllers\Api;

use App\Exports\MonthlyRecapExport;
use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RecapController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get monthly recap.
     */
    public function monthly(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user();
        $targetUserId = $user->id;

        // Direktur can view other user's recap
        if ($request->filled('user_id') && (int) $request->user_id !== $user->id) {
            if (! $user->hasPermission('view-all-logbook')) {
                return $this->errorResponse(
                    message: 'Anda tidak memiliki akses untuk melihat rekap user lain.',
                    code: 403
                );
            }
            $targetUserId = (int) $request->user_id;
        }

        $month = (int) $request->month;
        $year = (int) $request->year;

        $logbooks = Logbook::forUser($targetUserId)
            ->forMonth($month, $year)
            ->orderBy('date')
            ->get();

        $totalDuration = $logbooks->sum('duration_seconds');
        $totalEntries = $logbooks->count();

        $hours = floor($totalDuration / 3600);
        $minutes = floor(($totalDuration % 3600) / 60);
        $seconds = $totalDuration % 60;

        return $this->successResponse(
            data: [
                'user_id' => $targetUserId,
                'month' => $month,
                'year' => $year,
                'summary' => [
                    'total_duration_seconds' => $totalDuration,
                    'total_duration_formatted' => sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds),
                    'total_entries' => $totalEntries,
                ],
                'entries' => $logbooks->map(fn ($l) => [
                    'id' => $l->id,
                    'date' => $l->date->format('Y-m-d'),
                    'title' => $l->title,
                    'description' => $l->description,
                    'duration_seconds' => $l->duration_seconds,
                    'status' => $l->status,
                ])->values(),
            ],
            message: 'Monthly recap retrieved successfully.'
        );
    }

    /**
     * Export monthly recap as Excel.
     */
    public function export(Request $request): BinaryFileResponse|JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user();
        $targetUserId = $user->id;

        if ($request->filled('user_id') && (int) $request->user_id !== $user->id) {
            if (! $user->hasPermission('view-all-logbook')) {
                return $this->errorResponse(
                    message: 'Anda tidak memiliki akses untuk export rekap user lain.',
                    code: 403
                );
            }
            $targetUserId = (int) $request->user_id;
        }

        $month = (int) $request->month;
        $year = (int) $request->year;

        $filename = sprintf('recap_%d_%02d_%d.xlsx', $targetUserId, $month, $year);

        return Excel::download(
            new MonthlyRecapExport($targetUserId, $month, $year),
            $filename
        );
    }
}
