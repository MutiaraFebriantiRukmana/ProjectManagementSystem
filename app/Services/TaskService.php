<?php

namespace App\Services;

use App\Models\Task;
use Illuminate\Validation\ValidationException;

class TaskService
{
    /**
     * Validasi apakah Task boleh diubah statusnya menjadi 'done'.
     * Aturan: Task tidak bisa selesai jika ada task prerequisite di task_dependencies yang belum 'done'.
     *
     * @throws ValidationException
     */
    public function updateStatus(Task $task, string $newStatus): Task
    {
        if ($newStatus === 'done') {
            // Ambil semua task dependensi yang statusnya belum 'done'
            $unfinishedDependencies = $task->dependencies()
                ->where('status', '!=', 'done')
                ->pluck('title');

            if ($unfinishedDependencies->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'status' => 'Task tidak dapat diselesaikan karena masih terdapat dependency yang belum selesai: ' . $unfinishedDependencies->implode(', '),
                ]);
            }
        }

        $task->update(['status' => $newStatus]);

        return $task;
    }

    /**
     * Algoritma Fractional Position untuk Kanban Drag & Drop.
     */
    public function updatePosition(Task $task, ?float $prevPosition, ?float $nextPosition): Task
    {
        if ($prevPosition === null && $nextPosition === null) {
            $newPosition = 1000;
        } elseif ($prevPosition === null) {
            $newPosition = $nextPosition / 2;
        } elseif ($nextPosition === null) {
            $newPosition = $prevPosition + 1000;
        } else {
            $newPosition = ($prevPosition + $nextPosition) / 2;
        }

        $task->update(['position' => $newPosition]);

        return $task;
    }
}