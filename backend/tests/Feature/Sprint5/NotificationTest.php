<?php

namespace Tests\Feature\Sprint5;

use App\Models\Logbook;
use App\Models\PayrollSubmission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
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

    public function test_list_notifications_returns_correct_structure(): void
    {
        // Create a notification via database directly
        $this->karyawan->notify(new \App\Notifications\LogbookReviewedNotification(
            Logbook::create([
                'user_id' => $this->karyawan->id, 'title' => 'Test',
                'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
                'verification_status' => 'approved',
            ]),
            'approved'
        ));

        Sanctum::actingAs($this->karyawan);

        $response = $this->getJson('/api/notifications');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'items',
                    'unread_count',
                    'pagination' => ['current_page', 'last_page', 'total'],
                ],
            ]);

        $this->assertEquals(1, $response->json('data.unread_count'));
    }

    public function test_mark_notification_as_read(): void
    {
        $this->karyawan->notify(new \App\Notifications\LogbookReviewedNotification(
            Logbook::create([
                'user_id' => $this->karyawan->id, 'title' => 'Test',
                'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
                'verification_status' => 'approved',
            ]),
            'approved'
        ));

        $notificationId = $this->karyawan->notifications()->first()->id;
        Sanctum::actingAs($this->karyawan);

        $response = $this->postJson("/api/notifications/{$notificationId}/read");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNotNull($this->karyawan->notifications()->first()->read_at);
    }

    public function test_mark_all_notifications_as_read(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Test',
            'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'approved',
        ]);

        $this->karyawan->notify(new \App\Notifications\LogbookReviewedNotification($logbook, 'approved'));
        $this->karyawan->notify(new \App\Notifications\LogbookReviewedNotification($logbook, 'revision_requested', 'tolong perbaiki'));

        Sanctum::actingAs($this->karyawan);

        $response = $this->postJson('/api/notifications/read-all');

        $response->assertOk();
        $this->assertEquals(0, $this->karyawan->unreadNotifications()->count());
    }

    public function test_cannot_mark_other_users_notification(): void
    {
        $this->direktur->notify(new \App\Notifications\LogbookReviewedNotification(
            Logbook::create([
                'user_id' => $this->karyawan->id, 'title' => 'Test',
                'description' => 'Desc', 'date' => now(), 'duration_seconds' => 3600,
                'verification_status' => 'approved',
            ]),
            'approved'
        ));

        $notificationId = $this->direktur->notifications()->first()->id;
        Sanctum::actingAs($this->karyawan);

        $response = $this->postJson("/api/notifications/{$notificationId}/read");

        $response->assertStatus(404);
    }

    public function test_logbook_approve_triggers_notification(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Test Logbook',
            'description' => 'Description', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'pending',
        ]);

        Sanctum::actingAs($this->direktur);
        $this->postJson("/api/director/logbooks/{$logbook->id}/approve");

        $this->assertEquals(1, $this->karyawan->notifications()->count());
        $notifData = $this->karyawan->notifications()->first()->data;
        $this->assertEquals('approved', $notifData['action']);
    }

    public function test_logbook_revision_triggers_notification(): void
    {
        $logbook = Logbook::create([
            'user_id' => $this->karyawan->id, 'title' => 'Test Logbook',
            'description' => 'Description', 'date' => now(), 'duration_seconds' => 3600,
            'verification_status' => 'pending',
        ]);

        Sanctum::actingAs($this->direktur);
        $this->postJson("/api/director/logbooks/{$logbook->id}/request-revision", [
            'comment' => 'Tolong perbaiki deskripsinya',
        ]);

        $this->assertEquals(1, $this->karyawan->notifications()->count());
        $notifData = $this->karyawan->notifications()->first()->data;
        $this->assertEquals('revision_requested', $notifData['action']);
    }

    public function test_payroll_approval_triggers_notification(): void
    {
        $submission = PayrollSubmission::create([
            'user_id' => $this->karyawan->id, 'period_month' => 9, 'period_year' => 2026,
            'status' => 'submitted', 'submitted_at' => now(),
            'total_duration_seconds' => 5400, 'total_entries' => 2,
        ]);

        Sanctum::actingAs($this->direktur);
        $this->postJson("/api/director/payrolls/{$submission->id}/approve");

        $notifications = $this->karyawan->notifications;
        $this->assertGreaterThanOrEqual(1, $notifications->count());
    }
}
