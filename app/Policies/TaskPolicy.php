<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Super Admin bypasses all checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole(['super_admin', 'Super Admin'])) {
            return true;
        }

        return null;
    }

    public function view(User $user, Task $task): bool
    {
        $project = $task->project;

        return $user->hasPermissionTo('tasks.view') &&
            ($project->manager_id === $user->id || $project->members->contains($user->id));
    }

    public function create(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('tasks.create') &&
            ($project->manager_id === $user->id || $project->members->contains($user->id));
    }

    public function update(User $user, Task $task): bool
    {
        $project = $task->project;

        // Project Manager yang mengampu atau Assignee yang ditugaskan
        return $user->hasPermissionTo('tasks.update') &&
            ($project->manager_id === $user->id || $task->assignees->contains($user->id));
    }

    public function changeStatus(User $user, Task $task): bool
    {
        $project = $task->project;

        return $user->hasPermissionTo('tasks.change_status') &&
            ($project->manager_id === $user->id || $project->members->contains($user->id));
    }

    public function delete(User $user, Task $task): bool
    {
        $project = $task->project;

        return $user->hasPermissionTo('tasks.delete') && $project->manager_id === $user->id;
    }
}