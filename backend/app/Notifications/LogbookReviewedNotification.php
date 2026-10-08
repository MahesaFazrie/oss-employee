<?php

namespace App\Notifications;

use App\Models\Logbook;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LogbookReviewedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private Logbook $logbook,
        private string $action, // 'approved' or 'revision_requested'
        private ?string $comment = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $title = match ($this->action) {
            'approved'           => 'Logbook Disetujui',
            'revision_requested' => 'Logbook Perlu Revisi',
            default              => 'Update Logbook',
        };

        $message = match ($this->action) {
            'approved'           => "Logbook \"{$this->logbook->title}\" telah disetujui oleh Direktur.",
            'revision_requested' => "Logbook \"{$this->logbook->title}\" perlu direvisi.",
            default              => "Ada update pada logbook \"{$this->logbook->title}\".",
        };

        return [
            'title'       => $title,
            'message'     => $message,
            'entity_type' => 'logbook',
            'entity_id'   => $this->logbook->id,
            'action'      => $this->action,
            'comment'     => $this->comment,
        ];
    }
}
