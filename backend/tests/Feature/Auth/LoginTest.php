<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_login()
    {
        $role = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'email' => 'active@example.com',
            'password' => bcrypt('secret123'),
            'status' => 'active',
            'role_id' => $role->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'active@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login berhasil',
            ])
            ->assertJsonStructure([
                'data' => [
                    'user' => [
                        'id', 'name', 'email', 'status', 'role'
                    ],
                    'token'
                ]
            ]);
    }

    public function test_pending_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'pending@example.com',
            'password' => bcrypt('secret123'),
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'pending@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akun Anda belum disetujui oleh Superadmin.',
            ]);
    }

    public function test_rejected_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'rejected@example.com',
            'password' => bcrypt('secret123'),
            'status' => 'rejected',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'rejected@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akun Anda ditolak.',
            ]);
    }

    public function test_login_requires_valid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('secret123'),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Email atau password salah.',
            ]);
    }

    public function test_user_can_logout()
    {
        $user = User::factory()->create([
            'status' => 'active'
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
