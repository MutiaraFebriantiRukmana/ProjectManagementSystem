<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * User Model — refactored for full Spatie/laravel-permission RBAC.
 *
 * Roles (super_admin, project_manager, member, viewer):
 *   Managed entirely by Spatie. Use $user->assignRole(), $user->hasRole(),
 *   $user->hasPermissionTo() for all role/permission checks.
 *
 * Primary Key: standard `id` (BigIncrements) per app_specification.md SSOT.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Standard primary key ('id') per app_specification.md.
     * Previous implementation used 'user_id' which conflicted with Spatie expectations.
     */
    protected $primaryKey = 'id';

    public $timestamps = true;

    /**
     * Mass-assignable columns.
     * role_id removed — roles are now managed by Spatie pivot tables.
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'   => 'hashed',
            'is_active'  => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Projects where this user is the designated manager.
     */
    public function managedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'manager_id');
    }

    /**
     * Projects where this user is a member (via project_user pivot).
     */
    public function memberProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user', 'user_id', 'project_id');
    }

    // =========================================================================
    // ROLE HELPER METHODS (delegated to Spatie)
    // =========================================================================

    /**
     * Check if user is Super Admin.
     * Uses Spatie's hasRole() under the hood.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * Check if user is a Project Manager.
     */
    public function isProjectManager(): bool
    {
        return $this->hasRole('project_manager');
    }

    /**
     * Check if user is a Member.
     */
    public function isMember(): bool
    {
        return $this->hasRole('member');
    }

    /**
     * Check if user is a Viewer / Client.
     */
    public function isViewer(): bool
    {
        return $this->hasRole('viewer');
    }

    public function assignedTasks(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_user');
    }

    public function reportedTasks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Task::class, 'reporter_id');
    }

    public function commentMentions(): BelongsToMany
    {
        return $this->belongsToMany(Comment::class, 'comment_mentions');
    }
}
