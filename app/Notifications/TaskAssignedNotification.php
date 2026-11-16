<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public User $assignedBy
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'task_assigned',
            'title'      => 'Tugas Baru Ditugaskan',
            'message'    => "Anda ditugaskan pada task '{$this->task->title}' di project '{$this->task->project->name}' oleh {$this->assignedBy->username}.",
            'task_id'    => $this->task->id,
            'project_id' => $this->task->project_id,
        ];
    }
}