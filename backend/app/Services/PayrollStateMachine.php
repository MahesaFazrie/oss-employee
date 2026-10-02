<?php

namespace App\Services;

use InvalidArgumentException;

class PayrollStateMachine
{
    /**
     * All valid payroll statuses.
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_REVISION_REQUESTED = 'revision_requested';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_PROCESSED = 'processed';

    /**
     * Allowed state transitions.
     *
     * Format: 'from_status' => ['to_status_1', 'to_status_2', ...]
     */
    private const TRANSITIONS = [
        self::STATUS_DRAFT              => [self::STATUS_SUBMITTED],
        self::STATUS_SUBMITTED          => [self::STATUS_UNDER_REVIEW],
        self::STATUS_UNDER_REVIEW       => [self::STATUS_REVISION_REQUESTED, self::STATUS_APPROVED, self::STATUS_REJECTED],
        self::STATUS_REVISION_REQUESTED => [self::STATUS_SUBMITTED],
        self::STATUS_APPROVED           => [self::STATUS_PROCESSED],
        self::STATUS_REJECTED           => [],
        self::STATUS_PROCESSED          => [],
    ];

    /**
     * Check if a transition from one status to another is valid.
     */
    public function canTransition(string $from, string $to): bool
    {
        if (! isset(self::TRANSITIONS[$from])) {
            return false;
        }

        return in_array($to, self::TRANSITIONS[$from], true);
    }

    /**
     * Validate and return the new status, or throw exception.
     *
     * @throws InvalidArgumentException
     */
    public function transition(string $from, string $to): string
    {
        if (! $this->canTransition($from, $to)) {
            throw new InvalidArgumentException(
                "Transisi status dari '{$from}' ke '{$to}' tidak diizinkan."
            );
        }

        return $to;
    }

    /**
     * Get all allowed next statuses from current status.
     */
    public function allowedTransitions(string $from): array
    {
        return self::TRANSITIONS[$from] ?? [];
    }

    /**
     * Get all valid statuses.
     */
    public static function allStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_SUBMITTED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_REVISION_REQUESTED,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
            self::STATUS_PROCESSED,
        ];
    }
}
