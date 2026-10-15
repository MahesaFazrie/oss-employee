<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ResetPasswordController extends Controller
{
    use ApiResponseTrait;

    /**
     * Handle reset password request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $tokenRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $tokenRecord) {
            return $this->errorResponse(
                message: 'Token tidak valid atau sudah kedaluwarsa.',
                code: 400
            );
        }

        // Check if token matches (we hashed it using sha256)
        if (! hash_equals($tokenRecord->token, hash('sha256', $request->token))) {
            return $this->errorResponse(
                message: 'Token tidak valid atau sudah kedaluwarsa.',
                code: 400
            );
        }

        // Check expiration (60 minutes)
        $expireSeconds = config('auth.passwords.users.expire', 60) * 60;
        if (strtotime($tokenRecord->created_at) + $expireSeconds < time()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return $this->errorResponse(
                message: 'Token tidak valid atau sudah kedaluwarsa.',
                code: 400
            );
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        // Delete token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return $this->successResponse(
            data: null,
            message: 'Password berhasil diubah.'
        );
    }
}
