<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponseTrait;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    use ApiResponseTrait;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // If user is superadmin, grant access
        if ($user && $user->hasRole('superadmin')) {
            return $next($request);
        }

        if (! $user || ! $user->hasPermission($permission)) {
            return $this->errorResponse(message: 'Forbidden. You do not have the required permission.', code: 403);
        }

        return $next($request);
    }
}
