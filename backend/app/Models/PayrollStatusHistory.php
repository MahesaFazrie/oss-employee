<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_submission_id',
        'changed_by',
        'from_status',
        'to_status',
        'notes',
    ];

    // ─── Relationships ───────────────────────────────────

    public function payrollSubmission(): BelongsTo
    {
        return $this->belongsTo(PayrollSubmission::class);
    }

    /**
     * The user who performed this status change.
     */
    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
