<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\User::observe(\App\Observers\AuditLogObserver::class);
        \App\Models\Role::observe(\App\Observers\AuditLogObserver::class);
        \App\Models\Logbook::observe(\App\Observers\AuditLogObserver::class);
        \App\Models\PayrollSubmission::observe(\App\Observers\AuditLogObserver::class);
        \App\Models\PaymentProof::observe(\App\Observers\AuditLogObserver::class);
    }
}
