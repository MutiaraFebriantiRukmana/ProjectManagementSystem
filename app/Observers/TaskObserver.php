<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TaskObserver
{
    public function created(Task $task): void
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'TASK_CREATED',
            'entity_type' => Task::class,
            'entity_id'   => $task->id,
            'new_value'   => $task->only(['title', 'status', 'priority', 'project_id']),
        ]);
    }

    public function updated(Task $task): void
    {
        // Hanya catat jika ada perubahan kolom penting
        $dirty = $task->getDirty();
        if (empty($dirty)) {
            return;
        }

        $old = [];
        foreach ($dirty as $key => $value) {
            $old[$key] = $task->getOriginal($key);
        }

        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => isset($dirty['status']) ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
            'entity_type' => Task::class,
            'entity_id'   => $task->id,
            'old_value'   => $old,
            'new_value'   => $dirty,
        ]);
    }

    public function deleted(Task $task): void
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'TASK_DELETED',
            'entity_type' => Task::class,
            'entity_id'   => $task->id,
            'old_value'   => $task->only(['title', 'status', 'project_id']),
        ]);
    }
}