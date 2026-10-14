<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use ApiResponseTrait;

    /**
     * OSS-510: List audit logs with filtering.
     *
     * GET /api/admin/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name,email')->latest();

        // Filters
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', 'like', "%{$request->entity_type}%");
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(50);

        return $this->successResponse(
            data: [
                'items' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page'    => $logs->lastPage(),
                    'total'        => $logs->total(),
                    'per_page'     => $logs->perPage(),
                ]
            ],
            message: 'Audit logs berhasil diambil.'
        );
    }
}
