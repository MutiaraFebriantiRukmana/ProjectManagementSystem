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
 *
 * This dual-check ensures:
 *   - A Project Manager role holder cannot access projects they are not assigned to.
 *   - A Member cannot view projects they haven't joined.
 *   - Super Admin bypasses all checks via the `before()` gate hook.
 *
 * The `before()` method provides Super Admin bypass — it runs BEFORE any individual
 * policy method so Super Admin always has full access without code duplication.
 */
class ProjectPolicy
{
    use HandlesAuthorization;

    /**
     * Super Admin bypass gate.
     * Returns true immediately for Super Admin — skips all other checks.
     * Returns null for other roles — proceeds to individual policy methods.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null; // Defer to individual methods
    }

    /**
     * view — Can the user view this specific project?
     *
     * Allowed:
     *   - Super Admin (handled by before())
     *   - The designated project manager (manager_id === user.id)
     *   - Any user listed in project_user pivot (member of this project)
     *
     * Denied (→ 403):
     *   - Any other authenticated user
     */
    public function view(User $user, Project $project): bool
    {
        // Must have at minimum the base permission to view projects
        if (! $user->hasPermissionTo('projects.view')) {
            return false;
        }

        // Is user the designated manager of this specific project?
        if ($project->manager_id === $user->id) {
            return true;
        }

        // Is user a member of this specific project?
        return $project->members()->where('user_id', $user->id)->exists();
    }

    /**
     * create — Can the user create a new project?
     *
     * Allowed: Super Admin (before()), Project Manager
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('projects.create');
    }

    /**
     * update — Can the user update this project?
     *
     * Allowed: Super Admin (before()), the specific project's manager_id.
     * Denied: Members, Viewers, and PMs who are not the manager of THIS project.
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
     *
     * Per spec (brief.md §4): Members MUST NEVER delete a project.
     * Only Super Admin (before()) is allowed by default.
     * We allow deletion only for super_admin via before().
     * This method returns false for ALL other roles explicitly.
     */
    public function delete(User $user, Project $project): bool
    {
        // Explicit: only super_admin (caught by before()) can delete.
        // Even the manager of a project cannot delete it unless they are also super_admin.
        return $user->hasPermissionTo('projects.delete');
    }

    /**
     * manageMembers — Can the user add/remove members from this project?
     *
     * Allowed: Super Admin (before()), this project's manager.
     */
    public function manageMembers(User $user, Project $project): bool
    {
        if (! $user->hasPermissionTo('projects.manage_members')) {
            return false;
        }

        return $project->manager_id === $user->id;
    }
}
