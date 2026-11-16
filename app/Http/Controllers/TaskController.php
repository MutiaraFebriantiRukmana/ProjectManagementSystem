<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    protected TaskService $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    /**
     * Simpan Task Baru beserta Assignee, Label, dan Dependensinya.
     */
    public function store(StoreTaskRequest $request): RedirectResponse
    {
        /** @var Project $project */
        $project = Project::findOrFail($request->project_id);

        $user = Auth::user();
        $isSuperAdmin = $user->roles()->where('name', 'super_admin')->exists() || $user->hasRole('super_admin');
        if ($project->manager_id !== $user->id && !$isSuperAdmin) {
            abort(403, 'Tindakan tidak diizinkan! Hanya Project Manager atau Super Admin yang dapat membuat task.');
        }

        Gate::authorize('create', [Task::class, $project]);

        $data = $request->validated();
        $data['reporter_id'] = Auth::id();

        // Cari posisi terakhir untuk ordering
        $lastPosition = Task::where('project_id', $project->id)
            ->where('status', $data['status'] ?? 'todo')
            ->max('position') ?? 0;
        $data['position'] = (float) $lastPosition + 1000.0;

        /** @var Task $task */
        $task = Task::create($data);

        // Pasang relasi pivot
        if (!empty($data['assignees'])) {
            $task->assignees()->sync($data['assignees']);
        }
        if (!empty($data['labels'])) {
            $task->labels()->sync($data['labels']);
        }
        if (!empty($data['dependencies'])) {
            $task->dependencies()->sync($data['dependencies']);
        }

        return back()->with('success', 'Task berhasil dibuat.');
    }

    /**
     * Update Data Task General (termasuk Assignees)
     */
    public function update(\Illuminate\Http\Request $request, Task $task): RedirectResponse
    {
        // Authorization check
        $project = $task->project;
        $user = auth()->user();
        $isSuperAdmin = $user->roles()->where('name', 'super_admin')->exists() || $user->hasRole('super_admin');
        
        if (auth()->id() !== $project->manager_id && !$isSuperAdmin) {
            abort(403, 'Tindakan tidak diizinkan! Hanya Project Manager atau Super Admin yang dapat mengubah assignees.');
        }

        // Validate
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'status' => 'sometimes|string',
            'priority' => 'sometimes|string',
            'assignees' => 'sometimes|array',
            'assignees.*' => 'exists:users,id',
        ]);

        // Update basic fields
        $task->update($request->only(['title', 'description', 'status', 'priority']));

        // Update Assignees (Pivot)
        if ($request->has('assignees')) {
            $task->assignees()->sync($request->assignees);
        }

        return back()->with('success', 'Task berhasil diperbarui.');
    }

    /**
     * Update Status & Posisi Kanban (Drag and Drop + Dependency Validation).
     */
    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): RedirectResponse
    {
        Gate::authorize('changeStatus', $task);

        // 1. Validasi Task Dependency lewat Service Layer (Poin 8 Brief)
        $this->taskService->updateStatus($task, $request->status);

        // 2. Update Fractional Position untuk Kanban (Poin 9 Brief)
        if ($request->has('prev_position') || $request->has('next_position')) {
            $this->taskService->updatePosition(
                $task,
                $request->prev_position ? (float) $request->prev_position : null,
                $request->next_position ? (float) $request->next_position : null
            );
        }

        return back()->with('success', 'Status task berhasil diperbarui.');
    }

    /**
     * Hapus Task.
     */
    public function destroy(Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return back()->with('success', 'Task berhasil dihapus.');
    }
}