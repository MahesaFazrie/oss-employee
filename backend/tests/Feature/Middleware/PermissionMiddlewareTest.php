<?php

namespace Tests\Feature\Middleware;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;

    protected function setUp(): void
    {
        parent::setUp();

        $roleKaryawan = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $roleKaryawan->permissions()->attach($permission);

        $this->karyawan = User::factory()->create([
            'status' => 'active',
            'role_id' => $roleKaryawan->id,
        ]);
    }

    public function test_user_without_permission_is_forbidden()
    {
        // manage-users is required for GET /api/admin/users
        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/admin/users');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Forbidden. You do not have the required permission.',
            ]);
    }

    public function test_user_with_permission_can_access()
    {
        // Grant manage-users permission to karyawan for this test
        $manageUsers = Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        $this->karyawan->role->permissions()->attach($manageUsers);

        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/admin/users');

        $response->assertStatus(200);
    }
}
