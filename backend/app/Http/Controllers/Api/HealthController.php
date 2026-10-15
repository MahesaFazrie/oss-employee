<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Check application and database health.
     *
     * @return JsonResponse
     */
    public function __invoke(): JsonResponse
    {
        $dbStatus = 'disconnected';
        $appStatus = 'unhealthy';
        $message = 'Application is running with issues';

        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
            $appStatus = 'healthy';
            $message = 'Application is running';
        } catch (\Exception $e) {
            // Database connection failed — keep defaults
        }

        return $this->successResponse(
            data: [
                'status' => $appStatus,
                'database' => $dbStatus,
                'timestamp' => now()->toIso8601String(),
            ],
            message: $message,
        );
    }
}
