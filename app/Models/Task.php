<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Project;
use App\Models\User;
use App\Models\Label;
use App\Models\TaskAttachment;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'parent_id',
        'reporter_id',
        'title',
        'description',
        'status',
        'priority',
        'start_date',
        'end_date',
        'requires_approval',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'requires_approval' => 'boolean',
            'position' => 'double',
        ];
    }

    // Relasi ke Project
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // Pembuat Task
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    // Assignees (User yang ditugaskan)
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    // Parent Task (Jika ini adalah subtask)
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    // Subtasks (Daftar subtask anak)
    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    // Task yang harus selesai duluan sebelum task ini (Prerequisites)
    public function dependencies(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'depends_on_task_id');
    }

    // Task yang terhalang/menunggu task ini selesai
    public function blockedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'depends_on_task_id', 'task_id');
    }

    // Labels
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'label_task');
    }

    // Comments
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Attachments
    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    // Approval Workflow
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }
}