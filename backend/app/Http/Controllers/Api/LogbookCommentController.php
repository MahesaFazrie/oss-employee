<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\LogbookComment;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogbookCommentController extends Controller
{
    use ApiResponseTrait;

    /**
     * OSS-401: Add a comment to a logbook.
     *
     * Only the logbook owner and users with 'view-all-logbook' permission (Direktur) can comment.
     *
     * POST /api/logbooks/{id}/comments
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $logbook = Logbook::find($id);

        if (! $logbook) {
            return $this->errorResponse(message: 'Logbook tidak ditemukan.', code: 404);
        }

        // Only logbook owner or Direktur (view-all-logbook) can comment
        $isOwner = $logbook->user_id === $user->id;
        $isDirector = $user->hasPermission('view-all-logbook') || $user->hasRole('superadmin');

        if (! $isOwner && ! $isDirector) {
            return $this->errorResponse(message: 'Anda tidak memiliki akses untuk memberikan komentar pada logbook ini.', code: 403);
        }

        $comment = LogbookComment::create([
            'logbook_id' => $logbook->id,
            'user_id'    => $user->id,
            'comment'    => $request->comment,
        ]);

        $comment->load('user:id,name,email');

        return $this->successResponse(
            data: [
                'id'         => $comment->id,
                'logbook_id' => $comment->logbook_id,
                'user'       => [
                    'id'   => $comment->user->id,
                    'name' => $comment->user->name,
                ],
                'comment'    => $comment->comment,
                'created_at' => $comment->created_at->toIso8601String(),
            ],
            message: 'Komentar berhasil ditambahkan.',
            code: 201
        );
    }

    /**
     * OSS-401: List comments on a logbook.
     *
     * GET /api/logbooks/{id}/comments
     */
    public function index(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $logbook = Logbook::find($id);

        if (! $logbook) {
            return $this->errorResponse(message: 'Logbook tidak ditemukan.', code: 404);
        }

        // Only logbook owner or Direktur can view comments
        $isOwner = $logbook->user_id === $user->id;
        $isDirector = $user->hasPermission('view-all-logbook') || $user->hasRole('superadmin');

        if (! $isOwner && ! $isDirector) {
            return $this->errorResponse(message: 'Anda tidak memiliki akses untuk melihat komentar logbook ini.', code: 403);
        }

        $comments = $logbook->comments()->with('user:id,name,email')->get();

        return $this->successResponse(
            data: $comments->map(fn ($c) => [
                'id'         => $c->id,
                'user'       => [
                    'id'   => $c->user->id,
                    'name' => $c->user->name,
                ],
                'comment'    => $c->comment,
                'created_at' => $c->created_at->toIso8601String(),
            ]),
            message: 'Daftar komentar berhasil diambil.'
        );
    }
}
