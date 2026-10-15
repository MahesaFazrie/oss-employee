<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_generates_token()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Link reset password telah dikirim ke email Anda.',
            ]);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_forgot_password_requires_existing_email()
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'notfound@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_updates_password()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $token = 'test-token-123';
        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => hash('sha256', $token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Password berhasil diubah.',
            ]);

        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_reset_password_requires_valid_token()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => hash('sha256', 'valid-token'),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => 'invalid-token',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Token tidak valid atau sudah kedaluwarsa.',
            ]);
    }
}
