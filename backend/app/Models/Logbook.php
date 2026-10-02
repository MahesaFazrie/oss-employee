<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Logbook extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'work_timer_id',
        'title',
        'description',
        'date',
        'duration_seconds',
        'status',
        'verification_status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    // ─── Relationships ───────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workTimer(): BelongsTo
    {
        return $this->belongsTo(WorkTimer::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(LogbookComment::class)->orderBy('created_at');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(LogbookStatusHistory::class)->orderByDesc('created_at');
    }

    // ─── Scopes ──────────────────────────────────────────

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForMonth($query, int $month, int $year)
    {
        return $query->whereMonth('date', $month)->whereYear('date', $year);
    }

    public function scopeVerificationStatus($query, string $status)
    {
        return $query->where('verification_status', $status);
    }

    // ─── Helpers ─────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isVerificationPending(): bool
    {
        return $this->verification_status === 'pending';
    }

    public function isVerificationApproved(): bool
    {
        return $this->verification_status === 'approved';
    }

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
