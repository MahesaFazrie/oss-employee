<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get list of users, optionally filtered by status.
     */
    public function index(Request $request): JsonResponse
    {

        $query = User::with('role');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->get();

        return $this->successResponse(
            data: $users,
            message: 'User list retrieved successfully.'
        );
    }

    /**
     * Approve a user and assign a role.
     */
    public function approve(Request $request, string $id): JsonResponse
    {

        $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse(message: 'User not found.', code: 404);
        }

        if ($user->isActive()) {
            return $this->errorResponse(message: 'User is already active.', code: 400);
        }

        $user->status = 'active';
        $user->role_id = $request->role_id;
        $user->save();

        $user->load('role');

        return $this->successResponse(
            data: $user,
            message: 'User berhasil disetujui.'
        );
    }

    /**
     * Reject a user.
     */
    public function reject(Request $request, string $id): JsonResponse
    {

        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse(message: 'User not found.', code: 404);
        }

        if ($user->isRejected()) {
            return $this->errorResponse(message: 'User is already rejected.', code: 400);
        }

        $user->status = 'rejected';
        $user->save();

        return $this->successResponse(
            data: $user,
            message: 'User ditolak.'
        );
    }
}
