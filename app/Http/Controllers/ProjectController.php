<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectController
 *
 * Spec rule: NEVER write $request->validate() inside Controllers.
 *            Always use dedicated FormRequest classes.
 *
 * All authorization is enforced via ProjectPolicy (Gate::authorize()).
 * Frontend MUST NOT be trusted for authorization — this is the definitive
 * Anti-IDOR enforcement layer.
 */
class ProjectController extends Controller
{
    /**
     * List all projects accessible to the authenticated user.
     *
     * Super Admin → all projects.
     * Project Manager / Member / Viewer → only projects they belong to.
     *
     * Spec: All list endpoints MUST use ->paginate(15). Zero N+1 with eager loading.
     */
    public function index(): Response
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            $projects = Project::with(['manager', 'members'])->paginate(15);
        } else {
            // Only projects where user is manager OR member
            $projects = Project::with(['manager', 'members'])
                ->where(function ($query) use ($user) {
                    $query->where('manager_id', $user->id)
                          ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id));
                })
                ->paginate(15);
        }

        return Inertia::render('Projects/Index', [
            'projects' => $projects
        ]);
    }

    /**
     * Create a new project.
     *
     * Authorization: projects.create permission (Project Manager + Super Admin).
     * Validation: StoreProjectRequest (FormRequest).
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Gate::authorize('create', Project::class);

        $project = Project::create([
            ...$request->validated(),
            'manager_id' => auth()->id(),
        ]);

        // Note: For Many-to-Many or attaching creator to project if needed,
        // it would be done here, but currently they are the manager.

        return redirect()->route('projects.index')->with('success', 'Project created successfully.');
    }

    /**
     * Show a specific project.
     *
     * Anti-IDOR enforcement: Gate::authorize('view', $project) triggers
     * ProjectPolicy::view() which gates by manager_id or project_user pivot.
     */
    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        return Inertia::render('Projects/Show', [
            'project' => $project->load(['manager', 'members'])
        ]);
    }

    /**
     * Update an existing project.
     *
     * Authorization: Only Super Admin or the project's own manager_id.
     * Validation: UpdateProjectRequest (FormRequest).
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return redirect()->route('projects.show', $project)->with('success', 'Project updated successfully.');
    }

    /**
     * Delete a project.
     *
     * Authorization: ONLY Super Admin. Members MUST NEVER delete projects.
     */
    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project deleted successfully.');
    }
}

