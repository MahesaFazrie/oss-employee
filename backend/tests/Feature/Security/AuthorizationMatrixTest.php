<?php

namespace Tests\Feature\Security;

use App\Models\Logbook;
use App\Models\PayrollSubmission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * OSS-603: Authorization Matrix Security Test
 *
 * Tests every role x endpoint combination to ensure access is correct.
 * ✅ = allowed, ✗ = must return 403
 */
class AuthorizationMatrixTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;
    private User $direktur;
    private User $karyawan;

    protected function setUp(): void
    {
        parent::setUp();

        $superadminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $direkturRole = Role::create(['name' => 'direktur', 'guard_name' => 'web']);
        $karyawanRole = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);

        $manageUsers = Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        $manageRoles = Permission::create(['name' => 'manage-roles', 'guard_name' => 'web']);
        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $viewAllLogbook = Permission::create(['name' => 'view-all-logbook', 'guard_name' => 'web']);
        $managePayroll = Permission::create(['name' => 'manage-payroll', 'guard_name' => 'web']);
        $approvePayroll = Permission::create(['name' => 'approve-payroll', 'guard_name' => 'web']);
        $viewReports = Permission::create(['name' => 'view-reports', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-settings', 'guard_name' => 'web']);

        $karyawanRole->permissions()->attach([$viewLogbook->id, $manageLogbook->id, $managePayroll->id]);
        $direkturRole->permissions()->attach([$viewLogbook->id, $viewAllLogbook->id, $approvePayroll->id, $viewReports->id]);
        // superadmin has no permissions attached — middleware auto-grants

        $this->superadmin = User::create([
            'name' => 'Superadmin', 'email' => 'admin@test.com',
            'password' => 'password', 'role_id' => $superadminRole->id, 'status' => 'active',
        ]);
        $this->direktur = User::create([
            'name' => 'Direktur', 'email' => 'direktur@test.com',
            'password' => 'password', 'role_id' => $direkturRole->id, 'status' => 'active',
        ]);
        $this->karyawan = User::create([
            'name' => 'Karyawan', 'email' => 'karyawan@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
    }

    // ═══════════════════════════════════════════════════════
    // ADMIN ENDPOINTS (/api/admin/*)
    // ═══════════════════════════════════════════════════════

    // --- User Management ---
    public function test_superadmin_can_access_user_list(): void
    {
        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/admin/users')->assertOk();
    }

    public function test_direktur_cannot_access_user_list(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_karyawan_cannot_access_user_list(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/admin/users')->assertStatus(403);
    }

    // --- Role Management ---
    public function test_superadmin_can_access_roles(): void
    {
        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/admin/roles')->assertOk();
    }

    public function test_direktur_cannot_access_roles(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/admin/roles')->assertStatus(403);
    }

    public function test_karyawan_cannot_access_roles(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/admin/roles')->assertStatus(403);
    }

    // --- Audit Logs ---
    public function test_superadmin_can_access_audit_logs(): void
    {
        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/admin/audit-logs')->assertOk();
    }

    public function test_direktur_can_access_audit_logs(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/admin/audit-logs')->assertOk();
    }

    public function test_karyawan_cannot_access_audit_logs(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/admin/audit-logs')->assertStatus(403);
    }

    // ═══════════════════════════════════════════════════════
    // DIRECTOR ENDPOINTS (/api/director/*)
    // ═══════════════════════════════════════════════════════

    // --- Logbook Review ---
    public function test_superadmin_can_access_director_logbook_list(): void
    {
        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/director/logbooks')->assertOk();
    }

    public function test_direktur_can_access_director_logbook_list(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/director/logbooks')->assertOk();
    }

    public function test_karyawan_cannot_access_director_logbook_list(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/director/logbooks')->assertStatus(403);
    }

    // --- Payroll Review ---
    public function test_superadmin_can_access_director_payroll_list(): void
    {
        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/director/payrolls')->assertOk();
    }

    public function test_direktur_can_access_director_payroll_list(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/director/payrolls')->assertOk();
    }

    public function test_karyawan_cannot_access_director_payroll_list(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/director/payrolls')->assertStatus(403);
    }

    // --- Payroll Approve/Reject (karyawan must be blocked) ---
    public function test_karyawan_cannot_approve_payroll(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->karyawan);

        $this->postJson("/api/director/payrolls/{$submission->id}/approve")->assertStatus(403);
    }

    public function test_karyawan_cannot_reject_payroll(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->karyawan);

        $this->postJson("/api/director/payrolls/{$submission->id}/reject", ['notes' => 'test'])->assertStatus(403);
    }

    public function test_karyawan_cannot_mark_processed(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'approved', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->karyawan);

        $this->postJson("/api/director/payrolls/{$submission->id}/mark-processed")->assertStatus(403);
    }

    // --- Payment Proof Upload ---
    public function test_karyawan_cannot_upload_payment_proof(): void
    {
        Storage::fake('local');
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'approved', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->karyawan);

        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 500, 'application/pdf'),
        ])->assertStatus(403);
    }

    // ═══════════════════════════════════════════════════════
    // DASHBOARD ENDPOINTS (/api/dashboard/*)
    // ═══════════════════════════════════════════════════════

    public function test_karyawan_can_access_employee_dashboard(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/dashboard/employee')->assertOk();
    }

    public function test_direktur_can_access_employee_dashboard(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/dashboard/employee')->assertOk();
    }

    public function test_direktur_can_access_director_dashboard(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/dashboard/director')->assertOk();
    }

    public function test_superadmin_can_access_director_dashboard(): void
    {
        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/dashboard/director')->assertOk();
    }

    public function test_karyawan_cannot_access_director_dashboard(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/dashboard/director')->assertStatus(403);
    }

    // ═══════════════════════════════════════════════════════
    // TIMER & LOGBOOK ENDPOINTS
    // ═══════════════════════════════════════════════════════

    public function test_karyawan_can_start_timer(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->postJson('/api/timer/start')->assertStatus(201);
    }

    public function test_direktur_cannot_start_timer(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->postJson('/api/timer/start')->assertStatus(403);
    }

    public function test_karyawan_can_create_logbook(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->postJson('/api/logbooks', [
            'title' => 'Test', 'description' => 'Desc',
            'date' => now()->format('Y-m-d'), 'duration_seconds' => 3600,
        ])->assertStatus(201);
    }

    public function test_direktur_cannot_create_logbook(): void
    {
        Sanctum::actingAs($this->direktur);
        $this->postJson('/api/logbooks', [
            'title' => 'Test', 'description' => 'Desc',
            'date' => now()->format('Y-m-d'), 'duration_seconds' => 3600,
        ])->assertStatus(403);
    }

    // ═══════════════════════════════════════════════════════
    // NOTIFICATION ENDPOINTS
    // ═══════════════════════════════════════════════════════

    public function test_any_authenticated_user_can_access_notifications(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/notifications')->assertOk();

        Sanctum::actingAs($this->direktur);
        $this->getJson('/api/notifications')->assertOk();

        Sanctum::actingAs($this->superadmin);
        $this->getJson('/api/notifications')->assertOk();
    }

    // ═══════════════════════════════════════════════════════
    // UNAUTHENTICATED ACCESS
    // ═══════════════════════════════════════════════════════

    public function test_unauthenticated_cannot_access_protected_endpoints(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
        $this->getJson('/api/logbooks')->assertStatus(401);
        $this->getJson('/api/dashboard/employee')->assertStatus(401);
        $this->getJson('/api/dashboard/director')->assertStatus(401);
        $this->getJson('/api/notifications')->assertStatus(401);
        $this->getJson('/api/admin/audit-logs')->assertStatus(401);
        $this->getJson('/api/director/logbooks')->assertStatus(401);
        $this->getJson('/api/director/payrolls')->assertStatus(401);
    }
}
