<?php

namespace Tests\Feature\Sprint5;

use App\Models\Logbook;
use App\Models\PaymentProof;
use App\Models\PayrollSubmission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentProofTest extends TestCase
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

        $karyawanRole->permissions()->attach([$managePayroll->id, $viewLogbook->id, $manageLogbook->id]);
        $direkturRole->permissions()->attach([$approvePayroll->id, $viewLogbook->id, $viewAllLogbook->id]);

        $this->karyawan = User::create([
            'name' => 'Karyawan Test', 'email' => 'karyawan@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->direktur = User::create([
            'name' => 'Direktur Test', 'email' => 'direktur@test.com',
            'password' => 'password', 'role_id' => $direkturRole->id, 'status' => 'active',
        ]);
    }

    private function createApprovedPayroll(): PayrollSubmission
    {
        return PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'approved', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
    }

    // ─── Upload Tests ───────────────────────────────────

    public function test_direktur_can_upload_payment_proof(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.original_name', 'bukti.pdf');

        $this->assertDatabaseHas('payment_proofs', [
            'payroll_submission_id' => $submission->id,
            'uploaded_by' => $this->direktur->id,
        ]);
    }

    public function test_upload_rejects_invalid_file_type(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('malware.exe', 100, 'application/x-msdownload'),
        ]);

        $response->assertStatus(422);
    }

    public function test_upload_rejects_oversized_file(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('huge.pdf', 6000, 'application/pdf'), // > 5MB
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_upload_for_non_approved_payroll(): void
    {
        Storage::fake('local');
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertStatus(409);
    }

    public function test_karyawan_cannot_upload_payment_proof(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->karyawan);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertStatus(403);
    }

    public function test_upload_replaces_existing_proof(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        // Upload first
        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti1.pdf', 500, 'application/pdf'),
        ]);

        // Upload second (replaces)
        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti2.pdf', 500, 'application/pdf'),
        ]);

        $this->assertDatabaseCount('payment_proofs', 1);
        $this->assertDatabaseHas('payment_proofs', ['original_name' => 'bukti2.pdf']);
    }

    // ─── Download Tests ─────────────────────────────────

    public function test_direktur_can_download_payment_proof(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        // Upload first
        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $response = $this->get("/api/director/payrolls/{$submission->id}/payment-proof");
        $response->assertStatus(200);
    }

    public function test_payroll_owner_can_download_proof(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();

        // Upload as direktur
        Sanctum::actingAs($this->direktur);
        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        // Download as owner (karyawan)
        Sanctum::actingAs($this->karyawan);
        $response = $this->get("/api/director/payrolls/{$submission->id}/payment-proof");
        $response->assertStatus(200);
    }

    public function test_other_karyawan_cannot_download_proof(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();

        Sanctum::actingAs($this->direktur);
        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $karyawanRole = Role::where('name', 'karyawan')->first();
        $other = User::create([
            'name' => 'Other', 'email' => 'other@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        Sanctum::actingAs($other);

        $response = $this->getJson("/api/director/payrolls/{$submission->id}/payment-proof");
        $response->assertStatus(403);
    }

    public function test_download_returns_404_when_no_proof(): void
    {
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        $response = $this->getJson("/api/director/payrolls/{$submission->id}/payment-proof");
        $response->assertStatus(404);
    }

    // ─── Mark Processed Tests ───────────────────────────

    public function test_direktur_can_mark_payroll_as_processed(): void
    {
        Storage::fake('local');
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        // Upload proof first
        $this->postJson("/api/director/payrolls/{$submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/mark-processed");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'processed');

        $this->assertDatabaseHas('payroll_submissions', [
            'id' => $submission->id,
            'status' => 'processed',
        ]);

        $this->assertDatabaseHas('payroll_status_histories', [
            'payroll_submission_id' => $submission->id,
            'to_status' => 'processed',
        ]);
    }

    public function test_cannot_mark_processed_without_proof(): void
    {
        $submission = $this->createApprovedPayroll();
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/mark-processed");
        $response->assertStatus(422);
    }

    public function test_cannot_mark_processed_from_submitted_status(): void
    {
        Storage::fake('local');
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$submission->id}/mark-processed");
        // Either 422 (no proof) or 409 (invalid transition)
        $this->assertTrue(in_array($response->status(), [409, 422]));
    }
}
