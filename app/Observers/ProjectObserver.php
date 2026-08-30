<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;

class ProjectObserver
{
    public function created(Project $project): void
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'PROJECT_CREATED',
            'entity_type' => Project::class,
            'entity_id'   => $project->id,
            'new_value'   => $project->only(['name', 'status', 'manager_id', 'start_date', 'end_date']),
        ]);
    }

    public function updated(Project $project): void
    {
        $dirty = $project->getDirty();
        if (empty($dirty)) {
            return;
        }

        $old = [];
        foreach ($dirty as $key => $value) {
            $old[$key] = $project->getOriginal($key);
        }

        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => isset($dirty['status']) ? 'PROJECT_STATUS_CHANGED' : 'PROJECT_UPDATED',
            'entity_type' => Project::class,
            'entity_id'   => $project->id,
            'old_value'   => $old,
            'new_value'   => $dirty,
        ]);
    }

    public function deleted(Project $project): void
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => 'PROJECT_DELETED',
            'entity_type' => Project::class,
            'entity_id'   => $project->id,
            'old_value'   => $project->only(['name', 'status']),
        ]);
    }
}