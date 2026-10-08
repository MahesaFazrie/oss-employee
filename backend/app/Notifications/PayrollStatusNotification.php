<?php

namespace App\Notifications;

use App\Models\PayrollSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayrollStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        private PayrollSubmission $submission,
        private string $status, // 'submitted', 'approved', 'rejected', 'revision_requested', 'processed'
        private ?string $notes = null,
        private bool $isForDirector = false // If true, sent to Director. If false, sent to owner.
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $period = $this->submission->formattedPeriod();

        if ($this->isForDirector) {
            return [
                'title'       => 'Pengajuan Payroll Baru',
                'message'     => "{$this->submission->user->name} telah mengajukan payroll untuk {$period}.",
                'entity_type' => 'payroll',
                'entity_id'   => $this->submission->id,
                'status'      => $this->status,
            ];
        }

        $title = match ($this->status) {
            'approved'           => 'Payroll Disetujui',
            'rejected'           => 'Payroll Ditolak',
            'revision_requested' => 'Payroll Perlu Revisi',
            'processed'          => 'Payroll Telah Diproses',
            default              => 'Update Status Payroll',
        };

        $message = match ($this->status) {
            'approved'           => "Pengajuan payroll Anda untuk {$period} telah disetujui.",
            'rejected'           => "Pengajuan payroll Anda untuk {$period} ditolak.",
            'revision_requested' => "Pengajuan payroll Anda untuk {$period} memerlukan revisi.",
            'processed'          => "Payroll Anda untuk {$period} telah selesai diproses (pembayaran dikirim).",
            default              => "Status payroll Anda untuk {$period} berubah menjadi {$this->status}.",
        };

        return [
            'title'       => $title,
            'message'     => $message,
            'entity_type' => 'payroll',
            'entity_id'   => $this->submission->id,
            'status'      => $this->status,
            'notes'       => $this->notes,
        ];
    }
}
