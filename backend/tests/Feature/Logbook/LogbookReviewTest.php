<?php

namespace Tests\Feature\Logbook;

use App\Models\Logbook;
use App\Models\LogbookComment;
use App\Models\LogbookStatusHistory;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LogbookReviewTest extends TestCase
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

        $viewLogbook = Permission::create(['name' => 'view-logbook', 'guard_name' => 'web']);
        $manageLogbook = Permission::create(['name' => 'manage-logbook', 'guard_name' => 'web']);
        $viewAllLogbook = Permission::create(['name' => 'view-all-logbook', 'guard_name' => 'web']);
        $approvePayroll = Permission::create(['name' => 'approve-payroll', 'guard_name' => 'web']);

        $karyawanRole->permissions()->attach([$viewLogbook->id, $manageLogbook->id]);
        $direkturRole->permissions()->attach([$viewLogbook->id, $viewAllLogbook->id, $approvePayroll->id]);

        $this->karyawan = User::create([
            'name' => 'Karyawan', 'email' => 'karyawan@test.com',
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
    }

    // ─── OSS-401: Logbook Comments ───────────────────────

    public function test_direktur_can_comment_on_logbook(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/logbooks/{$logbook->id}/comments", [
            'comment' => 'Tolong tambahkan detail.',
        ])->assertStatus(201)
            ->assertJson(['data' => ['comment' => 'Tolong tambahkan detail.']]);
    }

    public function test_logbook_owner_can_comment(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
        ]);

        Sanctum::actingAs($this->karyawan, ['*']);
        $this->postJson("/api/logbooks/{$logbook->id}/comments", [
            'comment' => 'Sudah saya perbaiki.',
        ])->assertStatus(201);
    }

    public function test_other_karyawan_cannot_comment(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
        ]);

        Sanctum::actingAs($this->karyawan2, ['*']);
        $this->postJson("/api/logbooks/{$logbook->id}/comments", [
            'comment' => 'Saya coba komentar.',
        ])->assertStatus(403);
    }

    public function test_can_list_logbook_comments(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
        ]);

        LogbookComment::create(['logbook_id' => $logbook->id, 'user_id' => $this->direktur->id, 'comment' => 'Feedback 1']);
        LogbookComment::create(['logbook_id' => $logbook->id, 'user_id' => $this->karyawan->id, 'comment' => 'Response 1']);

        Sanctum::actingAs($this->karyawan, ['*']);
        $this->getJson("/api/logbooks/{$logbook->id}/comments")
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_other_karyawan_cannot_view_comments(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
        ]);

        Sanctum::actingAs($this->karyawan2, ['*']);
        $this->getJson("/api/logbooks/{$logbook->id}/comments")
            ->assertStatus(403);
    }

    // ─── OSS-403: Director Logbook Review ────────────────

    public function test_direktur_can_list_logbooks_for_review(): void
    {
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Pending 1',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
            'verification_status' => 'pending',
        ]);
        Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Approved 1',
            'date' => '2026-09-02', 'duration_seconds' => 1800, 'status' => 'draft',
            'verification_status' => 'approved',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->getJson('/api/director/logbooks?status=pending')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_karyawan_cannot_access_director_logbook_list(): void
    {
        Sanctum::actingAs($this->karyawan, ['*']);
        $this->getJson('/api/director/logbooks')->assertStatus(403);
    }

    public function test_direktur_can_approve_logbook(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
            'verification_status' => 'pending',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/logbooks/{$logbook->id}/approve")
            ->assertStatus(200)
            ->assertJson(['data' => ['verification_status' => 'approved']]);

        $this->assertDatabaseHas('logbook_status_histories', [
            'logbook_id' => $logbook->id,
            'from_status' => 'pending',
            'to_status' => 'approved',
            'changed_by' => $this->direktur->id,
        ]);
    }

    public function test_direktur_can_request_revision_with_comment(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
            'verification_status' => 'pending',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/logbooks/{$logbook->id}/request-revision", [
            'comment' => 'Deskripsi kurang jelas.',
        ])->assertStatus(200)
            ->assertJson(['data' => ['verification_status' => 'revision_requested']]);

        // Comment should be auto-created
        $this->assertDatabaseHas('logbook_comments', [
            'logbook_id' => $logbook->id,
            'user_id' => $this->direktur->id,
            'comment' => 'Deskripsi kurang jelas.',
        ]);

        // Status history recorded
        $this->assertDatabaseHas('logbook_status_histories', [
            'logbook_id' => $logbook->id,
            'to_status' => 'revision_requested',
        ]);
    }

    public function test_request_revision_requires_comment(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
            'verification_status' => 'pending',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/logbooks/{$logbook->id}/request-revision")
            ->assertStatus(422);
    }

    public function test_cannot_approve_already_approved_logbook(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
            'verification_status' => 'approved',
        ]);

        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/logbooks/{$logbook->id}/approve")
            ->assertStatus(409);
    }

    // ─── OSS-402: Karyawan sees feedback ─────────────────

    public function test_karyawan_sees_direktur_feedback_on_logbook(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Task A',
            'date' => '2026-09-01', 'duration_seconds' => 3600, 'status' => 'draft',
            'verification_status' => 'pending',
        ]);

        // Direktur requests revision (auto-creates comment)
        Sanctum::actingAs($this->direktur, ['*']);
        $this->postJson("/api/director/logbooks/{$logbook->id}/request-revision", [
            'comment' => 'Tambahkan detail lebih lengkap.',
        ]);

        // Karyawan can see the feedback comment
        Sanctum::actingAs($this->karyawan, ['*']);
        $response = $this->getJson("/api/logbooks/{$logbook->id}/comments");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['comment' => 'Tambahkan detail lebih lengkap.']);
    }
}
