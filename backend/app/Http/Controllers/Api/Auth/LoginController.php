<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    use ApiResponseTrait;

    /**
     * Handle incoming login request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse(
                message: 'Email atau password salah.',
                code: 401
            );
        }

        if ($user->isPending()) {
            return $this->errorResponse(
                message: 'Akun Anda belum disetujui oleh Superadmin.',
                code: 403
            );
        }

        if ($user->isRejected()) {
            return $this->errorResponse(
                message: 'Akun Anda ditolak.',
                code: 403
            );
        }

        // Akun active
        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role.permissions');

        return $this->successResponse(
            data: [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->status,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
            message: 'Login berhasil'
        );
    }
}
