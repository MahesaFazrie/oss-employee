<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollSnapshotItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_submission_id',
        'logbook_id',
        'title',
        'description',
        'date',
        'duration_seconds',
        'logbook_status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    // ─── Relationships ───────────────────────────────────

    public function payrollSubmission(): BelongsTo
    {
        return $this->belongsTo(PayrollSubmission::class);
    }

    // ─── Helpers ─────────────────────────────────────────

    /**
     * Format duration as HH:MM:SS.
     */
    public function formattedDuration(): string
    {
        $hours = floor($this->duration_seconds / 3600);
        $minutes = floor(($this->duration_seconds % 3600) / 60);
        $seconds = $this->duration_seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
    }
}
