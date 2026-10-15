<?php

namespace Tests\Feature\Payroll;

use App\Models\Logbook;
use App\Models\PayrollSubmission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;
    private User $karyawan2;
    private User $direktur;
    private string $token;
    private string $token2;
    private string $direktorToken;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles & permissions
        $karyawanRole = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $direkturRole = Role::create(['name' => 'direktur', 'guard_name' => 'web']);
        $managePayroll = Permission::create(['name' => 'manage-payroll', 'guard_name' => 'web']);
        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $approvePayroll = Permission::create(['name' => 'approve-payroll', 'guard_name' => 'web']);

        $karyawanRole->permissions()->attach([$managePayroll->id, $viewLogbook->id]);
        $direkturRole->permissions()->attach([$approvePayroll->id, $viewLogbook->id]);

        // Create users
        $this->karyawan = User::create([
            'name' => 'Karyawan 1', 'email' => 'karyawan1@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->karyawan2 = User::create([
            'name' => 'Karyawan 2', 'email' => 'karyawan2@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->direktur = User::create([
            'name' => 'Direktur', 'email' => 'direktur@test.com',
            'password' => 'password', 'role_id' => $direkturRole->id, 'status' => 'active',
        ]);

        $this->token = $this->karyawan->createToken('test')->plainTextToken;
        $this->token2 = $this->karyawan2->createToken('test')->plainTextToken;
        $this->direktorToken = $this->direktur->createToken('test')->plainTextToken;
    }

    // ─── OSS-304: Create Draft ───────────────────────────

    public function test_can_create_draft_payroll(): void
    {
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson('/api/payroll/draft', [
            'period_month' => 9,
            'period_year' => 2026,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user_id' => $this->karyawan->id,
                    'period_month' => 9,
                    'period_year' => 2026,
                    'status' => 'draft',
                ],
            ]);

        $this->assertDatabaseHas('payroll_submissions', [
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);
    }

    public function test_cannot_create_duplicate_draft_for_same_period(): void
    {
        // Create first draft
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        // Try to create second draft for same period
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson('/api/payroll/draft', [
            'period_month' => 9,
            'period_year' => 2026,
        ]);

        $response->assertStatus(409)
            ->assertJson(['success' => false]);
    }

    public function test_different_users_can_have_same_period(): void
    {
        // Karyawan 1 creates draft
        \Laravel\Sanctum\Sanctum::actingAs($this->karyawan, ['*']);
        $this->withHeaders([
            'Accept' => 'application/json',
        ])->postJson('/api/payroll/draft', [
            'period_month' => 9,
            'period_year' => 2026,
        ])->assertStatus(201);

        // Karyawan 2 creates draft for same period — should work
        \Laravel\Sanctum\Sanctum::actingAs($this->karyawan2, ['*']);
        $this->withHeaders([
            'Accept' => 'application/json',
        ])->postJson('/api/payroll/draft', [
            'period_month' => 9,
            'period_year' => 2026,
        ])->assertStatus(201);
    }

    // ─── OSS-304: Preview ────────────────────────────────

    public function test_can_preview_recap_for_payroll(): void
    {
        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Task 1',
            'date' => '2026-09-01',
            'duration_seconds' => 3600,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->getJson('/api/payroll/draft/preview?month=9&year=2026');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_entries' => 1,
                        'total_duration_seconds' => 3600,
                    ],
                ],
            ]);
    }

    // ─── OSS-305: Submit ─────────────────────────────────

    public function test_can_submit_draft_payroll(): void
    {
        // Create logbooks
        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Task A',
            'date' => '2026-09-01',
            'duration_seconds' => 3600,
            'status' => 'draft',
        ]);
        Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Task B',
            'date' => '2026-09-02',
            'duration_seconds' => 1800,
            'status' => 'draft',
        ]);

        // Create draft
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        // Submit
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson("/api/payroll/{$submission->id}/submit");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'submitted',
                    'total_duration_seconds' => 5400,
                    'total_entries' => 2,
                ],
            ]);

        // Verify snapshot items were created
        $this->assertDatabaseCount('payroll_snapshot_items', 2);
        $this->assertDatabaseHas('payroll_snapshot_items', [
            'payroll_submission_id' => $submission->id,
            'title' => 'Task A',
            'duration_seconds' => 3600,
        ]);
    }

    public function test_cannot_submit_already_submitted_payroll(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson("/api/payroll/{$submission->id}/submit");

        $response->assertStatus(409)
            ->assertJson(['success' => false]);
    }

    public function test_invalid_state_transition_returns_409(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'approved', // Can't go from approved back to submitted
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson("/api/payroll/{$submission->id}/submit");

        $response->assertStatus(409);
    }

    // ─── OSS-306: List & Detail ──────────────────────────

    public function test_can_list_own_payroll_submissions(): void
    {
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 8,
            'period_year' => 2026,
            'status' => 'submitted',
        ]);
        PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);
        // Other user's submission — should not appear
        PayrollSubmission::create([
            'user_id' => $this->karyawan2->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->getJson('/api/payroll');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_view_own_payroll_detail(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->getJson("/api/payroll/{$submission->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $submission->id,
                    'period_month' => 9,
                ],
            ]);
    }

    public function test_cannot_view_other_users_payroll(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan2->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->getJson("/api/payroll/{$submission->id}");

        $response->assertStatus(404);
    }

    // ─── OSS-311/312: Snapshot Immutability ──────────────

    public function test_snapshot_not_affected_by_logbook_edit_after_submit(): void
    {
        // Create logbook
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id,
            'title' => 'Original Title',
            'description' => 'Original description',
            'date' => '2026-09-01',
            'duration_seconds' => 3600,
            'status' => 'draft',
        ]);

        // Create and submit payroll
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson("/api/payroll/{$submission->id}/submit");

        // Now edit the source logbook AFTER submission
        $logbook->update([
            'title' => 'CHANGED Title',
            'description' => 'CHANGED description',
            'duration_seconds' => 9999,
        ]);

        // Verify snapshot still has ORIGINAL data
        $this->assertDatabaseHas('payroll_snapshot_items', [
            'payroll_submission_id' => $submission->id,
            'title' => 'Original Title',
            'description' => 'Original description',
            'duration_seconds' => 3600,
        ]);

        // Verify the source logbook has indeed changed
        $this->assertDatabaseHas('logbooks', [
            'id' => $logbook->id,
            'title' => 'CHANGED Title',
            'duration_seconds' => 9999,
        ]);
    }

    public function test_cannot_submit_other_users_payroll(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan2->id,
            'period_month' => 9,
            'period_year' => 2026,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ])->postJson("/api/payroll/{$submission->id}/submit");

        $response->assertStatus(404);
    }
}
