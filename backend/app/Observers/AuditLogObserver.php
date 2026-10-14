<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class AuditLogObserver
{
    public function created(Model $model): void
    {
        $this->logAction('created', $model, null, $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        // Don't log if no changes
        if (! $model->wasChanged()) {
            return;
        }

        $this->logAction(
            'updated', 
            $model, 
            array_intersect_key($model->getOriginal(), $model->getChanges()), 
            $model->getChanges()
        );
    }

    public function deleted(Model $model): void
    {
        $this->logAction('deleted', $model, $model->getAttributes(), null);
    }

    private function logAction(string $action, Model $model, ?array $before, ?array $after): void
    {
        // Don't log AuditLog itself (infinite loop) or uninteresting models
        if ($model instanceof AuditLog) {
            return;
        }

        // Exclude some fields from being logged (like passwords)
        $hiddenFields = ['password', 'remember_token'];
        if ($before) {
            foreach ($hiddenFields as $field) {
                unset($before[$field]);
            }
        }
        if ($after) {
            foreach ($hiddenFields as $field) {
                unset($after[$field]);
            }
        }

        AuditLog::create([
            'user_id'     => auth()->id() ?? null,
            'action'      => $action,
            'entity_type' => get_class($model),
            'entity_id'   => $model->getKey(),
            'changes'     => [
                'before' => $before,
                'after'  => $after,
            ],
            'ip_address'  => Request::ip(),
        ]);
    }
}
