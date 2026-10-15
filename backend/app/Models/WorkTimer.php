<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class WorkTimer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'started_at',
        'stopped_at',
        'status',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'stopped_at' => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function logbook(): HasOne
    {
        return $this->hasOne(Logbook::class);
    }

    // ─── Scopes ──────────────────────────────────────────

    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    public function scopeStopped($query)
    {
        return $query->where('status', 'stopped');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ─── Helpers ─────────────────────────────────────────

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isStopped(): bool
    {
        return $this->status === 'stopped';
    }

    /**
     * Calculate duration in seconds from started_at to now or stopped_at.
     */
    public function calculateDuration(): int
    {
        $end = $this->stopped_at ?? now();
        return (int) $this->started_at->diffInSeconds($end);
    }
}
