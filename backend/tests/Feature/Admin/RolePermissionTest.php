<?php

namespace Tests\Feature\Admin;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;
    private User $karyawan;

    protected function setUp(): void
    {
        parent::setUp();

        $roleSuperadmin = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $roleKaryawan = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create([
            'status' => 'active',
            'role_id' => $roleSuperadmin->id,
        ]);

        $this->karyawan = User::factory()->create([
            'status' => 'active',
            'role_id' => $roleKaryawan->id,
        ]);
    }

    public function test_superadmin_can_get_roles()
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/admin/roles');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_superadmin_can_create_role()
    {
        $response = $this->actingAs($this->superadmin)
            ->postJson('/api/admin/roles', [
                'name' => 'hrd',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Role berhasil dibuat.',
            ]);

        $this->assertDatabaseHas('roles', [
            'name' => 'hrd',
        ]);
    }

    public function test_superadmin_cannot_delete_default_roles()
    {
        $roleSuperadmin = Role::where('name', 'superadmin')->first();

        $response = $this->actingAs($this->superadmin)
            ->deleteJson("/api/admin/roles/{$roleSuperadmin->id}");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Cannot delete default role.',
            ]);
    }

    public function test_superadmin_can_delete_custom_role()
    {
        $role = Role::create(['name' => 'custom', 'guard_name' => 'web']);

        $response = $this->actingAs($this->superadmin)
            ->deleteJson("/api/admin/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Role berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('roles', [
            'id' => $role->id,
        ]);
    }

    public function test_superadmin_can_sync_permissions_to_role()
    {
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $permission1 = Permission::create(['name' => 'view-reports', 'guard_name' => 'web']);
        $permission2 = Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);

        $response = $this->actingAs($this->superadmin)
            ->postJson("/api/admin/roles/{$role->id}/permissions", [
                'permission_ids' => [$permission1->id, $permission2->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Permissions berhasil disinkronisasi.',
            ]);

        $this->assertDatabaseHas('role_permission', [
            'role_id' => $role->id,
            'permission_id' => $permission1->id,
        ]);

        $this->assertDatabaseHas('role_permission', [
            'role_id' => $role->id,
            'permission_id' => $permission2->id,
        ]);
    }

    public function test_superadmin_can_get_permissions()
    {
        Permission::create(['name' => 'test-permission', 'guard_name' => 'web']);

        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/admin/permissions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_non_superadmin_cannot_access_roles_api()
    {
        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/admin/roles');

        $response->assertStatus(403);
    }
}
