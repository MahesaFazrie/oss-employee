<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get the authenticated user info.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('role.permissions');

        return $this->successResponse(
            data: [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'role' => $user->role,
            ],
            message: 'User profile retrieved successfully'
        );
    }
}
