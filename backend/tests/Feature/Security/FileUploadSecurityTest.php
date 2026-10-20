<?php

namespace Tests\Feature\Security;

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
 * OSS-604: File Upload Security Test
 *
 * Tests for malicious file uploads, path traversal, oversized files,
 * and direct public access prevention.
 */
class FileUploadSecurityTest extends TestCase
{
    use RefreshDatabase;

    private User $direktur;
    private PayrollSubmission $submission;

    protected function setUp(): void
    {
        parent::setUp();

        $karyawanRole = Role::create(['name' => 'karyawan', 'guard_name' => 'web']);
        $direkturRole = Role::create(['name' => 'direktur', 'guard_name' => 'web']);

        $approvePayroll = Permission::create(['name' => 'approve-payroll', 'guard_name' => 'web']);
        $managePayroll = Permission::create(['name' => 'manage-payroll', 'guard_name' => 'web']);
        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $viewAllLogbook = Permission::create(['name' => 'view-all-logbook', 'guard_name' => 'web']);

        $karyawanRole->permissions()->attach([$managePayroll->id, $viewLogbook->id, $manageLogbook->id]);
        $direkturRole->permissions()->attach([$approvePayroll->id, $viewLogbook->id, $viewAllLogbook->id]);

        $karyawan = User::create([
            'name' => 'Karyawan', 'email' => 'karyawan@test.com',
            'password' => 'password', 'role_id' => $karyawanRole->id, 'status' => 'active',
        ]);
        $this->direktur = User::create([
            'name' => 'Direktur', 'email' => 'direktur@test.com',
            'password' => 'password', 'role_id' => $direkturRole->id, 'status' => 'active',
        ]);

        $this->submission = PayrollSubmission::create([
            'user_id' => $karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'approved', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);
    }

    // ─── Disallowed File Extensions ─────────────────────

    public function test_reject_php_file_upload(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('shell.php', 100, 'text/x-php'),
        ]);

        $response->assertStatus(422);
    }

    public function test_reject_exe_file_upload(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('malware.exe', 100, 'application/x-msdownload'),
        ]);

        $response->assertStatus(422);
    }

    public function test_reject_html_file_upload(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('xss.html', 100, 'text/html'),
        ]);

        $response->assertStatus(422);
    }

    public function test_reject_svg_file_upload(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('vector.svg', 100, 'image/svg+xml'),
        ]);

        $response->assertStatus(422);
    }

    public function test_reject_zip_file_upload(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('archive.zip', 100, 'application/zip'),
        ]);

        $response->assertStatus(422);
    }

    // ─── Allowed File Extensions ────────────────────────

    public function test_accept_pdf_file(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        $response->assertStatus(201);
    }

    public function test_accept_jpg_file(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->image('bukti.jpg', 800, 600),
        ]);

        $response->assertStatus(201);
    }

    public function test_accept_png_file(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->image('bukti.png', 800, 600),
        ]);

        $response->assertStatus(201);
    }

    // ─── File Size Limits ───────────────────────────────

    public function test_reject_file_over_5mb(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('huge.pdf', 5121, 'application/pdf'), // 5121 KB > 5120 KB
        ]);

        $response->assertStatus(422);
    }

    public function test_accept_file_at_5mb(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('exact.pdf', 5120, 'application/pdf'), // exactly 5MB
        ]);

        $response->assertStatus(201);
    }

    // ─── Storage Privacy ────────────────────────────────

    public function test_file_stored_in_private_disk(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        // File should be in private storage, not public
        $files = Storage::disk('local')->allFiles('payment-proofs');
        $this->assertNotEmpty($files);
        Storage::disk('local')->assertExists($files[0]);
    }

    public function test_uploaded_file_not_accessible_via_public_url(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", [
            'file' => UploadedFile::fake()->create('bukti.pdf', 1024, 'application/pdf'),
        ]);

        // Try direct public URL — should not be accessible
        $response = $this->get('/storage/payment-proofs/bukti.pdf');
        $this->assertTrue(in_array($response->status(), [404, 403]));
    }

    // ─── Missing / Empty File ───────────────────────────

    public function test_reject_upload_without_file(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->direktur);

        $response = $this->postJson("/api/director/payrolls/{$this->submission->id}/payment-proof", []);

        $response->assertStatus(422);
    }

    // ─── Authentication Required for Download ───────────

    public function test_unauthenticated_cannot_download_proof(): void
    {
        $response = $this->getJson("/api/director/payrolls/{$this->submission->id}/payment-proof");
        $response->assertStatus(401);
    }
}
