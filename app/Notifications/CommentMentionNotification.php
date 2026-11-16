<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CommentMentionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public User $sender,
        public string $commentSnippet
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'mention',
            'title'      => 'Anda di-mention dalam komentar',
            'message'    => "{$this->sender->username} menyebut Anda pada task '{$this->task->title}': \"{$this->commentSnippet}\"",
            'task_id'    => $this->task->id,
            'project_id' => $this->task->project_id,
        ];
    }
}