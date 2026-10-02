<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogbookStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'logbook_id',
        'changed_by',
        'from_status',
        'to_status',
        'notes',
    ];

    // ─── Relationships ───────────────────────────────────

    public function logbook(): BelongsTo
    {
        return $this->belongsTo(Logbook::class);
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
