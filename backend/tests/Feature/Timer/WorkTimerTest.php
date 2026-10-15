<?php

namespace Tests\Feature\Timer;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkTimer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkTimerTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $role->permissions()->attach($manageLogbook);

        $this->karyawan = User::factory()->create([
            'status' => 'active',
            'role_id' => $role->id,
        ]);
    }

    public function test_user_can_start_timer()
    {
        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/timer/start');

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Timer dimulai.',
            ])
            ->assertJsonPath('data.status', 'running');

        $this->assertDatabaseHas('work_timers', [
            'user_id' => $this->karyawan->id,
            'status' => 'running',
        ]);
    }

    public function test_double_start_returns_conflict()
    {
        WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now(),
            'status' => 'running',
        ]);

        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/timer/start');

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Anda sudah memiliki timer yang sedang berjalan.',
            ]);
    }

    public function test_get_active_timer()
    {
        $timer = WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now()->subMinutes(5),
            'status' => 'running',
        ]);

        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/timer/active');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.id', $timer->id)
            ->assertJsonPath('data.status', 'running');

        // elapsed_seconds should be roughly 300 (5 minutes)
        $elapsed = $response->json('data.elapsed_seconds');
        $this->assertGreaterThanOrEqual(299, $elapsed);
    }

    public function test_get_active_timer_when_none_exists()
    {
        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/timer/active');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => null,
            ]);
    }

    public function test_stop_timer()
    {
        WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now()->subMinutes(10),
            'status' => 'running',
        ]);

        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/timer/stop');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Timer dihentikan.',
            ])
            ->assertJsonPath('data.status', 'stopped');

        $this->assertNotNull($response->json('data.duration_seconds'));
        $this->assertGreaterThanOrEqual(599, $response->json('data.duration_seconds'));
    }

    public function test_stop_when_no_active_timer()
    {
        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/timer/stop');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Tidak ada timer aktif.',
            ]);
    }

    public function test_cancel_timer()
    {
        WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now()->subMinutes(5),
            'status' => 'running',
        ]);

        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/timer/cancel');

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_user_cannot_stop_another_users_timer()
    {
        $otherUser = User::factory()->create([
            'status' => 'active',
            'role_id' => $this->karyawan->role_id,
        ]);

        WorkTimer::create([
            'user_id' => $otherUser->id,
            'started_at' => now(),
            'status' => 'running',
        ]);

        // This user has no running timer, so stop should return 404
        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/timer/stop');

        $response->assertStatus(404);
    }
}
