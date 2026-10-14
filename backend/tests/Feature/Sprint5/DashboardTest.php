<?php

namespace Tests\Feature\Sprint5;

use App\Models\Logbook;
use App\Models\PayrollSubmission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkTimer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;
    private User $direktur;

    protected function setUp(): void
    {
        parent::setUp();

        $karyawanRole = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $direkturRole = Role::create(['name' => 'direktur', 'guard_name' => 'web']);

        $managePayroll = Permission::create(['name' => 'manage-payroll', 'guard_name' => 'web']);
        $approvePayroll = Permission::create(['name' => 'approve-payroll', 'guard_name' => 'web']);
        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $viewAllLogbook = Permission::create(['name' => 'view-all-logbook', 'guard_name' => 'web']);
        $viewReports = Permission::create(['name' => 'view-reports', 'guard_name' => 'web']);

        $karyawanRole->permissions()->attach([$managePayroll->id, $viewLogbook->id, $manageLogbook->id]);
        $direkturRole->permissions()->attach([$approvePayroll->id, $viewLogbook->id, $viewAllLogbook->id, $viewReports->id]);

        $this->karyawan = User::create([
            'name' => 'Karyawan Test', 'email' => 'karyawan@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->direktur = User::create([
            'name' => 'Direktur Test', 'email' => 'direktur@test.com',
            'password' => 'password', 'role_id' => $direkturRole->id, 'status' => 'active',
        ]);
    }

    // ─── Employee Dashboard ─────────────────────────────

    public function test_employee_dashboard_returns_expected_structure(): void
    {
        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/dashboard/employee');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success', 'data' => [
                    'active_timer',
                    'current_month' => ['month', 'year', 'total_duration_seconds', 'total_hours', 'logbook_count'],
                    'latest_payroll',
                    'logbooks_needing_revision',
                ],
            ]);
    }

    public function test_employee_dashboard_shows_active_timer(): void
    {
        WorkTimer::create([
            'user_id' => $this->karyawan->id,
            'started_at' => now()->subMinutes(30),
            'status' => 'running',
        ]);
        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/dashboard/employee');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotNull($data['active_timer']);
        $this->assertArrayHasKey('elapsed', $data['active_timer']);
    }

    public function test_employee_dashboard_shows_null_timer_when_none(): void
    {
        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/dashboard/employee');

        $response->assertOk()
            ->assertJsonPath('data.active_timer', null);
    }

    public function test_employee_dashboard_counts_revision_logbooks(): void
    {
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Test',
            'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'revision_requested',
        ]);
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Test2',
            'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'approved',
        ]);
        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/dashboard/employee');

        $response->assertOk()
            ->assertJsonPath('data.logbooks_needing_revision', 1);
    }

    public function test_employee_dashboard_shows_latest_payroll(): void
    {
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 8, 'period_year' => 2026,
            'status' => 'approved', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 7200, 'total_entries' => 3,
        ]);
        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/dashboard/employee');

        $response->assertOk()
            ->assertJsonPath('data.latest_payroll.period_month', 9)
            ->assertJsonPath('data.latest_payroll.status', 'submitted');
    }

    // ─── Director Dashboard ─────────────────────────────

    public function test_director_dashboard_returns_expected_structure(): void
    {
        Sanctum::actingAs($this->direktur);

        $response = $this->getJson('/api/dashboard/director');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success', 'data' => [
                    'logbooks_pending_review',
                    'payrolls_pending_approval',
                    'payrolls_pending_processing',
                    'total_active_employees',
                    'monthly_work_hours',
                    'recent_payrolls',
                ],
            ]);
    }

    public function test_director_dashboard_counts_pending_logbooks(): void
    {
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Pending',
            'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'pending',
        ]);
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Approved',
            'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'approved',
        ]);
        Sanctum::actingAs($this->direktur);

        $response = $this->getJson('/api/dashboard/director');

        $response->assertOk()
            ->assertJsonPath('data.logbooks_pending_review', 1);
    }

    public function test_director_dashboard_counts_pending_payrolls(): void
    {
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 8, 'period_year' => 2026,
            'status' => 'approved', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->direktur);

        $response = $this->getJson('/api/dashboard/director');

        $response->assertOk()
            ->assertJsonPath('data.payrolls_pending_approval', 1)
            ->assertJsonPath('data.payrolls_pending_processing', 1);
    }

    public function test_director_dashboard_returns_monthly_work_hours(): void
    {
        Sanctum::actingAs($this->direktur);

        $response = $this->getJson('/api/dashboard/director');

        $data = $response->json('data.monthly_work_hours');
        $this->assertCount(6, $data);
        $this->assertArrayHasKey('month', $data[0]);
        $this->assertArrayHasKey('total_hours', $data[0]);
    }

    public function test_karyawan_cannot_access_director_dashboard(): void
    {
        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/dashboard/director');

        $response->assertStatus(403);
    }
}
