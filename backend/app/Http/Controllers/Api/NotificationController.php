<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    /**
     * OSS-508: List notifications for the authenticated user.
     *
     * GET /api/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(20);

        return $this->successResponse(
            data: [
                'items' => $notifications->map(fn($n) => [
                    'id'         => $n->id,
                    'type'       => $n->type,
                    'data'       => $n->data,
                    'read_at'    => $n->read_at ? $n->read_at->toIso8601String() : null,
                    'created_at' => $n->created_at->toIso8601String(),
                ])->values(),
                'unread_count' => $user->unreadNotifications()->count(),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page'    => $notifications->lastPage(),
                    'total'        => $notifications->total(),
                ]
            ],
            message: 'Daftar notifikasi berhasil diambil.'
        );
    }

    /**
     * OSS-508: Mark a specific notification as read.
     *
     * POST /api/notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return $this->errorResponse(message: 'Notifikasi tidak ditemukan.', code: 404);
        }

        $notification->markAsRead();

        return $this->successResponse(
            data: null,
            message: 'Notifikasi ditandai sudah dibaca.'
        );
    }

    /**
     * OSS-508: Mark all notifications as read.
     *
     * POST /api/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->successResponse(
            data: null,
            message: 'Semua notifikasi ditandai sudah dibaca.'
        );
    }
}
