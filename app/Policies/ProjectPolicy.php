<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * ProjectPolicy — Backend Anti-IDOR Authorization
 *
 * Spec reference: APP_SPECIFICATION.md §3.3 (Project Authorization / Anti-IDOR)
 *
 * DESIGN PRINCIPLE:
 *   Authorization is a two-layer check:
 *   1. Spatie permission check: does the user's role include this permission?
 *   2. Ownership/membership check: is this user the manager OR a member of THIS project?
 */
class ProjectPolicy
{
    use HandlesAuthorization;

    /**
     * Super Admin bypass gate.
     * Menggunakan Spatie hasRole resmi.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole(['super_admin', 'Super Admin'])) {
            return true;
        }

        return null; // Defer to individual methods
    }

    /**
     * view — Can the user view this specific project?
     */
    public function view(User $user, Project $project): bool
    {
        if (! $user->hasPermissionTo('projects.view')) {
            return false;
        }

        if ($project->manager_id === $user->id) {
            return true;
        }

        return $project->members()->where('user_id', $user->id)->exists();
    }

    /**
     * create — Can the user create a new project?
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('projects.create');
    }

    /**
     * update — Can the user update this project?
     */
    public function update(User $user, Project $project): bool
    {
        if (! $user->hasPermissionTo('projects.update')) {
            return false;
        }

        return $project->manager_id === $user->id;
    }

    /**
     * delete — Can the user delete this project?
     * Per brief: Only Super Admin can delete projects.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('projects.delete');
    }

    /**
     * manageMembers — Can the user add/remove members from this project?
     */
    public function manageMembers(User $user, Project $project): bool
    {
        if (! $user->hasPermissionTo('projects.manage_members')) {
            return false;
        }

        return $project->manager_id === $user->id;
    }
}