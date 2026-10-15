<?php

namespace Tests\Feature\Recap;

use App\Models\Logbook;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyRecapTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;
    private User $direktur;

    protected function setUp(): void
    {
        parent::setUp();

        $roleKaryawan = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $roleDirektur = Role::create(['name' => 'direktur', 'guard_name' => 'web']);

        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $viewAll = Permission::create(['name' => 'view-all-logbook', 'guard_name' => 'web']);

        $roleKaryawan->permissions()->attach([$viewLogbook->id, $manageLogbook->id]);
        $roleDirektur->permissions()->attach([$viewLogbook->id, $viewAll->id]);

        $this->karyawan = User::factory()->create([
            'status' => 'active',
            'role_id' => $roleKaryawan->id,
        ]);

        $this->direktur = User::factory()->create([
            'status' => 'active',
            'role_id' => $roleDirektur->id,
        ]);
    }

    public function test_get_monthly_recap()
    {
        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Entry 1',
            'date' => '2026-09-01',
            'duration_seconds' => 3600,
        ]);

        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Entry 2',
            'date' => '2026-09-15',
            'duration_seconds' => 7200,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/recap/monthly?month=9&year=2026');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'month' => 9,
                    'year' => 2026,
                    'summary' => [
                        'total_duration_seconds' => 10800,
                        'total_duration_formatted' => '03:00:00',
                        'total_entries' => 2,
                    ],
                ],
            ]);

        $this->assertCount(2, $response->json('data.entries'));
    }

    public function test_empty_month_returns_success_with_empty_data()
    {
        $response = $this->actingAs($this->karyawan)
            ->getJson('/api/recap/monthly?month=1&year=2020');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_duration_seconds' => 0,
                        'total_entries' => 0,
                    ],
                    'entries' => [],
                ],
            ]);
    }

    public function test_direktur_can_view_karyawan_recap()
    {
        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Karyawan entry',
            'date' => '2026-09-10',
            'duration_seconds' => 3600,
        ]);

        $response = $this->actingAs($this->direktur)
            ->getJson("/api/recap/monthly?month=9&year=2026&user_id={$this->karyawan->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_id' => $this->karyawan->id,
                    'summary' => [
                        'total_entries' => 1,
                    ],
                ],
            ]);
    }

    public function test_karyawan_cannot_view_other_recap()
    {
        $otherUser = User::factory()->create([
            'status' => 'active',
            'role_id' => $this->karyawan->role_id,
        ]);

        $response = $this->actingAs($this->karyawan)
            ->getJson("/api/recap/monthly?month=9&year=2026&user_id={$otherUser->id}");

        $response->assertStatus(403);
    }
}
