<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserApprovalTest extends TestCase
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

    public function test_superadmin_can_get_pending_users()
    {
        User::factory()->create(['status' => 'pending']);
        User::factory()->create(['status' => 'pending']);
        User::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/admin/users?status=pending');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_superadmin_can_approve_user_and_assign_role()
    {
        $pendingUser = User::factory()->create(['status' => 'pending']);
        $roleDirektur = Role::create(['name' => 'direktur', 'guard_name' => 'web']);

        $response = $this->actingAs($this->superadmin)
            ->postJson("/api/admin/users/{$pendingUser->id}/approve", [
                'role_id' => $roleDirektur->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User berhasil disetujui.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $pendingUser->id,
            'status' => 'active',
            'role_id' => $roleDirektur->id,
        ]);
    }

    public function test_superadmin_can_reject_user()
    {
        $pendingUser = User::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->superadmin)
            ->postJson("/api/admin/users/{$pendingUser->id}/reject");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User ditolak.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $pendingUser->id,
            'status' => 'rejected',
        ]);
    }

    public function test_non_superadmin_cannot_approve_user()
    {
        $pendingUser = User::factory()->create(['status' => 'pending']);
        $roleDirektur = Role::create(['name' => 'direktur', 'guard_name' => 'web']);

        $response = $this->actingAs($this->karyawan)
            ->postJson("/api/admin/users/{$pendingUser->id}/approve", [
                'role_id' => $roleDirektur->id,
            ]);

        $response->assertStatus(403);
    }

    public function test_non_superadmin_cannot_get_users()
    {
        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/admin/users');

        $response->assertStatus(403);
    }
}
