<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get list of all permissions.
     */
    public function index(Request $request): JsonResponse
    {

        $permissions = Permission::all();

        return $this->successResponse(
            data: $permissions,
            message: 'Permissions retrieved successfully.'
        );
    }
}
