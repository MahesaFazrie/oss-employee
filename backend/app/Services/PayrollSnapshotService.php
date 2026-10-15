<?php

namespace App\Services;

use App\Models\Logbook;
use App\Models\PayrollSnapshotItem;
use App\Models\PayrollSubmission;

class PayrollSnapshotService
{
    /**
     * Create snapshot items from the user's logbooks for the given period.
     *
     * This "freezes" the logbook data into the payroll submission so that
     * future edits to the source logbooks do NOT affect the snapshot.
     *
     * @return array{total_duration: int, total_entries: int}
     */
    public function createSnapshot(PayrollSubmission $submission): array
    {
        $logbooks = Logbook::forUser($submission->user_id)
            ->forMonth($submission->period_month, $submission->period_year)
            ->orderBy('date')
            ->get();

        $totalDuration = 0;
        $totalEntries = 0;

        foreach ($logbooks as $logbook) {
            PayrollSnapshotItem::create([
                'payroll_submission_id' => $submission->id,
                'logbook_id'           => $logbook->id,
                'title'                => $logbook->title,
                'description'          => $logbook->description,
                'date'                 => $logbook->date,
                'duration_seconds'     => $logbook->duration_seconds,
                'logbook_status'       => $logbook->status,
            ]);

            $totalDuration += $logbook->duration_seconds;
            $totalEntries++;
        }

        return [
            'total_duration' => $totalDuration,
            'total_entries'  => $totalEntries,
        ];
    }
}
