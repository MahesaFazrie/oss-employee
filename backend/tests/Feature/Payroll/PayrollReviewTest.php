<?php

namespace Tests\Feature\Payroll;

use App\Models\Logbook;
use App\Models\PayrollSnapshotItem;
use App\Models\PayrollStatusHistory;
use App\Models\PayrollSubmission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PayrollReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;
    private User $karyawan2;
    private User $direktur;

    protected function setUp(): void
    {
        parent::setUp();

        $karyawanRole = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $direkturRole = Role::create(['name' => 'direktur', 'guard_name' => 'web']);

        $managePayroll = Permission::create(['name' => 'manage-payroll', 'guard_name' => 'web']);
        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $approvePayroll = Permission::create(['name' => 'approve-payroll', 'guard_name' => 'web']);
        $viewAllLogbook = Permission::create(['name' => 'view-all-logbook', 'guard_name' => 'web']);

        $karyawanRole->permissions()->attach([$managePayroll->id, $viewLogbook->id, $manageLogbook->id]);
        $direkturRole->permissions()->attach([$approvePayroll->id, $viewLogbook->id, $viewAllLogbook->id]);

        $this->karyawan = User::create([
            'name' => 'Karyawan Test', 'email' => 'karyawan@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->karyawan2 = User::create([
            'name' => 'Karyawan 2', 'email' => 'karyawan2@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->direktur = User::create([
            'name' => 'Direktur Test', 'email' => 'direktur@test.com',
            'password' => 'password', 'role_id' => $direkturRole->id, 'status' => 'active',
        ]);
    }

    private function createSubmittedPayroll(User $user): PayrollSubmission
    {
        return PayrollSubmission::create([
            'user_id' => $user->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
    }

    // ─── Director: List Payrolls ─────────────────────────

    public function test_direktur_can_list_payrolls(): void
    {
        $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->getJson('/api/director/payrolls')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_direktur_can_filter_payrolls_by_status(): void
    {
        $this->createSubmittedPayroll($this->karyawan);
        PayrollSubmission::create([
            'user_id' => $this->karyawan2->id, 'period_month' => 8, 'period_year' => 2026,
            'status' => 'draft',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->getJson('/api/director/payrolls?status=submitted')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_karyawan_cannot_access_director_payroll_list(): void
    {
        Sanctum::actingAs($this->karyawan, ['*']);
        $this->getJson('/api/director/payrolls')->assertStatus(403);
    }

    // ─── Director: View Detail ───────────────────────────

    public function test_direktur_can_view_payroll_detail(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->getJson("/api/director/payrolls/{$submission->id}")
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'user', 'status', 'snapshot_items', 'status_history']]);
    }

    // ─── Director: Approve ───────────────────────────────

    public function test_direktur_can_approve_payroll(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/approve", [
            'notes' => 'Data verified.',
        ])->assertStatus(200)
            ->assertJson(['data' => ['status' => 'approved']]);

        $this->assertDatabaseHas('payroll_status_histories', [
            'payroll_submission_id' => $submission->id,
            'to_status' => 'approved',
            'changed_by' => $this->direktur->id,
        ]);
    }

    // ─── Director: Reject ────────────────────────────────

    public function test_direktur_can_reject_payroll_with_reason(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/reject", [
            'notes' => 'Data anomali ditemukan.',
        ])->assertStatus(200)
            ->assertJson(['data' => ['status' => 'rejected']]);

        $this->assertDatabaseHas('payroll_status_histories', [
            'to_status' => 'rejected',
            'notes' => 'Data anomali ditemukan.',
        ]);
    }

    public function test_reject_requires_notes(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/reject")
            ->assertStatus(422);
    }

    // ─── Director: Request Revision ──────────────────────

    public function test_direktur_can_request_revision(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/request-revision", [
            'notes' => 'Perbaiki logbook tanggal 5.',
        ])->assertStatus(200)
            ->assertJson(['data' => ['status' => 'revision_requested']]);
    }

    public function test_request_revision_requires_notes(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/request-revision")
            ->assertStatus(422);
    }

    // ─── State Machine Enforcement ───────────────────────

    public function test_cannot_approve_draft_payroll(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'draft',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/approve")
            ->assertStatus(409);
    }

    public function test_cannot_approve_already_approved(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$submission->id}/approve")
            ->assertStatus(409);
    }

    // ─── Karyawan: Resubmit ──────────────────────────────

    public function test_karyawan_can_resubmit_after_revision(): void
    {
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Updated Task',
            'date' => '2026-09-01', 'duration_seconds' => 7200, 'status' => 'draft',
        ]);

        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'revision_requested',
        ]);

        Sanctum::actingAs($this->karyawan, ['*']);
        $this->postJson("/api/payroll/{$submission->id}/resubmit")
            ->assertStatus(200)
            ->assertJson(['data' => ['status' => 'submitted', 'total_duration_seconds' => 7200]]);
    }

    public function test_cannot_resubmit_if_not_revision_requested(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted',
        ]);

        Sanctum::actingAs($this->karyawan, ['*']);
        $this->postJson("/api/payroll/{$submission->id}/resubmit")
            ->assertStatus(409);
    }

    // ─── Payroll History ─────────────────────────────────

    public function test_karyawan_can_view_own_payroll_history(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan);
        PayrollStatusHistory::create([
            'payroll_submission_id' => $submission->id,
            'changed_by' => $this->karyawan->id,
            'from_status' => 'draft', 'to_status' => 'submitted',
        ]);

        Sanctum::actingAs($this->karyawan, ['*']);
        $this->getJson("/api/payroll/{$submission->id}/history")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_karyawan_cannot_view_others_payroll_history(): void
    {
        $submission = $this->createSubmittedPayroll($this->karyawan2);

        Sanctum::actingAs($this->karyawan, ['*']);
        $this->getJson("/api/payroll/{$submission->id}/history")
            ->assertStatus(404);
    }

    // ─── Full Flow ───────────────────────────────────────

    public function test_full_submit_revision_resubmit_approve_flow(): void
    {
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Sprint Planning',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
        ]);

        // 1. Karyawan: create draft & submit
        Sanctum::actingAs($this->karyawan, ['*']);
        $draft = $this->postJson('/api/payroll/draft', ['period_month' => 9, 'period_year' => 2026]);
        $id = $draft->json('data.id');
        $this->postJson("/api/payroll/{$id}/submit")->assertJson(['data' => ['status' => 'submitted']]);

        // 2. Direktur: request revision
        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$id}/request-revision", [
            'notes' => 'Tambahkan deskripsi.',
        ])->assertJson(['data' => ['status' => 'revision_requested']]);

        // 3. Karyawan: resubmit
        Sanctum::actingAs($this->karyawan, ['*']);
        $this->postJson("/api/payroll/{$id}/resubmit")->assertJson(['data' => ['status' => 'submitted']]);

        // 4. Direktur: approve
        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/payrolls/{$id}/approve", [
            'notes' => 'OK after revision.',
        ])->assertJson(['data' => ['status' => 'approved']]);

        // Verify full history: 6 records
        $histories = PayrollStatusHistory::where('payroll_submission_id', $id)->orderBy('id')->get();
        $this->assertCount(6, $histories);
        $this->assertEquals('draft', $histories[0]->from_status);
        $this->assertEquals('submitted', $histories[0]->to_status);
        $this->assertEquals('revision_requested', $histories[2]->to_status);
        $this->assertEquals('approved', $histories[5]->to_status);
    }
}
