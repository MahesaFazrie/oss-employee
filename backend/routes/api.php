<?php

use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', HealthController::class)->name('api.health');

// Public Auth Routes
Route::post('/register', RegisterController::class)->name('api.register');
Route::post('/login', LoginController::class)->name('api.login');
Route::post('/forgot-password', ForgotPasswordController::class)->name('api.forgot-password');
Route::post('/reset-password', ResetPasswordController::class)->name('api.reset-password');

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class)->name('api.logout');
    Route::get('/me', MeController::class)->name('api.me');

    // Timer Routes
    Route::middleware('check.permission:manage-logbook')->prefix('timer')->group(function () {
        Route::post('/start', [App\Http\Controllers\Api\TimerController::class, 'start'])->name('api.timer.start');
        Route::get('/active', [App\Http\Controllers\Api\TimerController::class, 'active'])->name('api.timer.active');
        Route::post('/stop', [App\Http\Controllers\Api\TimerController::class, 'stop'])->name('api.timer.stop');
        Route::post('/cancel', [App\Http\Controllers\Api\TimerController::class, 'cancel'])->name('api.timer.cancel');
    });

    // Logbook Routes
    Route::middleware('check.permission:manage-logbook')->group(function () {
        Route::post('/logbooks', [App\Http\Controllers\Api\LogbookController::class, 'store'])->name('api.logbooks.store');
        Route::put('/logbooks/{id}', [App\Http\Controllers\Api\LogbookController::class, 'update'])->name('api.logbooks.update');
    });

    Route::middleware('check.permission:view-logbook')->group(function () {
        Route::get('/logbooks', [App\Http\Controllers\Api\LogbookController::class, 'index'])->name('api.logbooks.index');
        Route::get('/logbooks/{id}', [App\Http\Controllers\Api\LogbookController::class, 'show'])->name('api.logbooks.show');
    });

    // Logbook Comments (owner + Direktur)
    Route::post('/logbooks/{id}/comments', [App\Http\Controllers\Api\LogbookCommentController::class, 'store'])->name('api.logbooks.comments.store');
    Route::get('/logbooks/{id}/comments', [App\Http\Controllers\Api\LogbookCommentController::class, 'index'])->name('api.logbooks.comments.index');

    // Recap Routes
    Route::middleware('check.permission:view-logbook')->prefix('recap')->group(function () {
        Route::get('/monthly', [App\Http\Controllers\Api\RecapController::class, 'monthly'])->name('api.recap.monthly');
        Route::get('/monthly/export', [App\Http\Controllers\Api\RecapController::class, 'export'])->name('api.recap.monthly.export');
    });

    // Payroll Routes (Karyawan)
    Route::middleware('check.permission:manage-payroll')->prefix('payroll')->group(function () {
        Route::post('/draft', [App\Http\Controllers\Api\PayrollController::class, 'createDraft'])->name('api.payroll.draft');
        Route::get('/draft/preview', [App\Http\Controllers\Api\PayrollController::class, 'preview'])->name('api.payroll.draft.preview');
        Route::post('/{id}/submit', [App\Http\Controllers\Api\PayrollController::class, 'submit'])->name('api.payroll.submit');
        Route::post('/{id}/resubmit', [App\Http\Controllers\Api\PayrollController::class, 'resubmit'])->name('api.payroll.resubmit');
        Route::get('/', [App\Http\Controllers\Api\PayrollController::class, 'index'])->name('api.payroll.index');
        Route::get('/{id}', [App\Http\Controllers\Api\PayrollController::class, 'show'])->name('api.payroll.show');
    });

    // Payroll Status History (accessible by owner + Direktur)
    Route::get('/payroll/{id}/history', [App\Http\Controllers\Api\PayrollController::class, 'history'])->name('api.payroll.history');

    // ─── Director Routes ─────────────────────────────────
    Route::prefix('director')->middleware('check.permission:approve-payroll')->group(function () {
        // Logbook Review
        Route::get('/logbooks', [App\Http\Controllers\Api\Director\DirectorLogbookController::class, 'index'])->name('api.director.logbooks.index');
        Route::post('/logbooks/{id}/approve', [App\Http\Controllers\Api\Director\DirectorLogbookController::class, 'approve'])->name('api.director.logbooks.approve');
        Route::post('/logbooks/{id}/request-revision', [App\Http\Controllers\Api\Director\DirectorLogbookController::class, 'requestRevision'])->name('api.director.logbooks.request-revision');

        // Payroll Review
        Route::get('/payrolls', [App\Http\Controllers\Api\Director\DirectorPayrollController::class, 'index'])->name('api.director.payrolls.index');
        Route::get('/payrolls/{id}', [App\Http\Controllers\Api\Director\DirectorPayrollController::class, 'show'])->name('api.director.payrolls.show');
        Route::post('/payrolls/{id}/approve', [App\Http\Controllers\Api\Director\DirectorPayrollController::class, 'approve'])->name('api.director.payrolls.approve');
        Route::post('/payrolls/{id}/reject', [App\Http\Controllers\Api\Director\DirectorPayrollController::class, 'reject'])->name('api.director.payrolls.reject');
        Route::post('/payrolls/{id}/request-revision', [App\Http\Controllers\Api\Director\DirectorPayrollController::class, 'requestRevision'])->name('api.director.payrolls.request-revision');
    });

    // ─── Admin Routes ────────────────────────────────────
    Route::prefix('admin')->group(function () {
        Route::middleware('check.permission:manage-users')->group(function () {
            Route::get('/users', [UserManagementController::class, 'index'])->name('api.admin.users.index');
            Route::post('/users/{id}/approve', [UserManagementController::class, 'approve'])->name('api.admin.users.approve');
            Route::post('/users/{id}/reject', [UserManagementController::class, 'reject'])->name('api.admin.users.reject');
        });

        Route::middleware('check.permission:manage-roles')->group(function () {
            Route::apiResource('roles', App\Http\Controllers\Api\Admin\RoleController::class);
            Route::post('/roles/{id}/permissions', [App\Http\Controllers\Api\Admin\RoleController::class, 'syncPermissions'])->name('api.admin.roles.permissions.sync');
            Route::get('/permissions', [App\Http\Controllers\Api\Admin\PermissionController::class, 'index'])->name('api.admin.permissions.index');
        });
    });
});
