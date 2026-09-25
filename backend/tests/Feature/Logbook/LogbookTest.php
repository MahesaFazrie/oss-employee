<?php

namespace Tests\Feature\Logbook;

use App\Models\Logbook;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkTimer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogbookTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;
    private Role $roleKaryawan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->roleKaryawan = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $this->roleKaryawan->permissions()->attach([$manageLogbook->id, $viewLogbook->id]);

        $this->karyawan = User::factory()->create([
            'status' => 'active',
            'role_id' => $this->roleKaryawan->id,
        ]);
    }

    public function test_create_logbook_with_timer()
    {
        $timer = WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now()->subHour(),
            'stopped_at' => now(),
            'status' => 'stopped',
            'duration_seconds' => 3600,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/logbooks', [
                'title' => 'Sprint Planning',
                'description' => 'Discuss sprint goals',
                'date' => now()->format('Y-m-d'),
                'work_timer_id' => $timer->id,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Logbook berhasil dibuat.',
            ]);

        $this->assertDatabaseHas('logbooks', [
            'user_id' => $this->karyawan->id,
            'work_timer_id' => $timer->id,
            'duration_seconds' => 3600,
        ]);
    }

    public function test_create_logbook_with_manual_duration()
    {
        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/logbooks', [
                'title' => 'Code Review',
                'date' => now()->format('Y-m-d'),
                'duration_seconds' => 1800,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('logbooks', [
            'duration_seconds' => 1800,
            'work_timer_id' => null,
        ]);
    }

    public function test_cannot_use_another_users_timer()
    {
        $otherUser = User::factory()->create([
            'status' => 'active',
            'role_id' => $this->roleKaryawan->id,
        ]);

        $timer = WorkTimer::create([
            'user_id' => $otherUser->id,
            'started_at' => now()->subHour(),
            'stopped_at' => now(),
            'status' => 'stopped',
            'duration_seconds' => 3600,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/logbooks', [
                'title' => 'Stealing timer',
                'date' => now()->format('Y-m-d'),
                'work_timer_id' => $timer->id,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Timer bukan milik Anda.',
            ]);
    }

    public function test_cannot_reuse_timer_already_in_logbook()
    {
        $timer = WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now()->subHour(),
            'stopped_at' => now(),
            'status' => 'stopped',
            'duration_seconds' => 3600,
        ]);

        Logbook::create([
            'user_id' => $this->karyawan->id,
            'work_timer_id' => $timer->id,
            'title' => 'First logbook',
            'date' => now()->format('Y-m-d'),
            'duration_seconds' => 3600,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->postJson('/api/logbooks', [
                'title' => 'Second logbook',
                'date' => now()->format('Y-m-d'),
                'work_timer_id' => $timer->id,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Timer sudah digunakan di logbook lain.',
            ]);
    }

    public function test_list_logbooks_with_month_filter()
    {
        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Sept entry',
            'date' => '2026-09-15',
            'duration_seconds' => 3600,
        ]);

        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Oct entry',
            'date' => '2026-10-01',
            'duration_seconds' => 1800,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/logbooks?month=9&year=2026');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Sept entry', $response->json('data.0.title'));
    }

    public function test_show_logbook_detail()
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Detail test',
            'date' => now()->format('Y-m-d'),
            'duration_seconds' => 3600,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->getJson("/api/logbooks/{$logbook->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Detail test');
    }

    public function test_update_draft_logbook()
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Original title',
            'date' => now()->format('Y-m-d'),
            'duration_seconds' => 3600,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->karyawan)
            ->putJson("/api/logbooks/{$logbook->id}", [
                'title' => 'Updated title',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('logbooks', [
            'id' => $logbook->id,
            'title' => 'Updated title',
        ]);
    }

    public function test_cannot_update_submitted_logbook()
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Submitted logbook',
            'date' => now()->format('Y-m-d'),
            'duration_seconds' => 3600,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->karyawan)
            ->putJson("/api/logbooks/{$logbook->id}", [
                'title' => 'Try update',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Logbook yang sudah disubmit tidak dapat diedit.',
            ]);
    }
}
