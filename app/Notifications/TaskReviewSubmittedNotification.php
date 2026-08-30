<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TaskReviewSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public User $submittedBy
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'review_submitted',
            'title'      => 'Task Butuh Approval',
            'message'    => "{$this->submittedBy->username} telah mengajukan review untuk task '{$this->task->title}'.",
            'task_id'    => $this->task->id,
            'project_id' => $this->task->project_id,
        ];
    }
}