<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use ApiResponseTrait;

    private array $defaultRoles = ['superadmin', 'direktur', 'karyawan'];

    /**
     * Get list of roles.
     */
    public function index(Request $request): JsonResponse
    {

        $roles = Role::with('permissions')->get();

        return $this->successResponse(
            data: $roles,
            message: 'Roles retrieved successfully.'
        );
    }

    /**
     * Create a new role.
     */
    public function store(Request $request): JsonResponse
    {

        $request->validate([
            'name' => ['required', 'string', 'unique:roles,name'],
        ]);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
        ]);

        return $this->successResponse(
            data: $role,
            message: 'Role berhasil dibuat.',
            code: 201
        );
    }

    /**
     * Update an existing role.
     */
    public function update(Request $request, string $id): JsonResponse
    {

        $role = Role::find($id);

        if (! $role) {
            return $this->errorResponse(message: 'Role not found.', code: 404);
        }

        if (in_array($role->name, $this->defaultRoles)) {
            return $this->errorResponse(message: 'Cannot edit default role name.', code: 400);
        }

        $request->validate([
            'name' => ['required', 'string', 'unique:roles,name,' . $role->id],
        ]);

        $role->name = $request->name;
        $role->save();

        return $this->successResponse(
            data: $role,
            message: 'Role berhasil diupdate.'
        );
    }

    /**
     * Delete a role.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {

        $role = Role::find($id);

        if (! $role) {
            return $this->errorResponse(message: 'Role not found.', code: 404);
        }

        if (in_array($role->name, $this->defaultRoles)) {
            return $this->errorResponse(message: 'Cannot delete default role.', code: 400);
        }

        $role->delete();

        return $this->successResponse(
            data: null,
            message: 'Role berhasil dihapus.'
        );
    }

    /**
     * Sync permissions to a role.
     */
    public function syncPermissions(Request $request, string $id): JsonResponse
    {

        $role = Role::find($id);

        if (! $role) {
            return $this->errorResponse(message: 'Role not found.', code: 404);
        }

        $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);

        $role->permissions()->sync($request->permission_ids);

        $role->load('permissions');

        return $this->successResponse(
            data: $role,
            message: 'Permissions berhasil disinkronisasi.'
        );
    }
}
