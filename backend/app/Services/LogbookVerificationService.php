<?php

namespace App\Services;

use App\Models\Logbook;
use App\Models\LogbookStatusHistory;
use InvalidArgumentException;

class LogbookVerificationService
{
    /**
     * Valid verification statuses.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REVISION_REQUESTED = 'revision_requested';

    /**
     * Allowed transitions for logbook verification.
     */
    private const TRANSITIONS = [
        self::STATUS_PENDING            => [self::STATUS_APPROVED, self::STATUS_REVISION_REQUESTED],
        self::STATUS_REVISION_REQUESTED => [self::STATUS_PENDING, self::STATUS_APPROVED],
        self::STATUS_APPROVED           => [], // Final state — cannot be undone
    ];

    /**
     * Transition verification status and record history.
     *
     * @throws InvalidArgumentException
     */
    public function transition(Logbook $logbook, string $toStatus, int $changedBy, ?string $notes = null): void
    {
        $fromStatus = $logbook->verification_status;

        if (! $this->canTransition($fromStatus, $toStatus)) {
            throw new InvalidArgumentException(
                "Transisi verifikasi dari '{$fromStatus}' ke '{$toStatus}' tidak diizinkan."
            );
        }

        $logbook->update(['verification_status' => $toStatus]);

        LogbookStatusHistory::create([
            'logbook_id'  => $logbook->id,
            'changed_by'  => $changedBy,
            'from_status' => $fromStatus,
            'to_status'   => $toStatus,
            'notes'       => $notes,
        ]);
    }

    public function canTransition(string $from, string $to): bool
    {
        return isset(self::TRANSITIONS[$from]) && in_array($to, self::TRANSITIONS[$from], true);
    }
}
