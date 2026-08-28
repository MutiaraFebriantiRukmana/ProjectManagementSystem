<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectController
 *
 * Spec rule: NEVER write $request->validate() inside Controllers where avoidable.
 *            Always use dedicated FormRequest classes.
 *
 * All authorization is enforced via ProjectPolicy (Gate::authorize()).
 * Anti-IDOR enforcement layer active on backend.
 */
class ProjectController extends Controller
{
    /**
     * List all projects accessible to the authenticated user.
     *
     * Super Admin → all projects.
     * Project Manager / Member / Viewer → only projects they belong to.
     *
     * Supports optional query params:
     *   ?search=  — partial match on project name
     *   ?status=  — exact match on status enum
     *
     * Spec: All list endpoints MUST use ->paginate(15). Zero N+1 with eager loading.
     */
    public function index(Request $request): Response
    {
        $user   = auth()->user();
        $search = $request->query('search');
        $status = $request->query('status');

        $query = Project::with(['manager', 'members']);

        // Menggunakan Spatie hasRole resmi (bukan legacy isSuperAdmin)
        if (! $user->hasRole(['super_admin', 'Super Admin'])) {
            // Only projects where user is manager OR member
            $query->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                  ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
            });
        }

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        if ($status && in_array($status, ['planning', 'active', 'on_hold', 'completed', 'cancelled'])) {
            $query->where('status', $status);
        }

        $projects = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters'  => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new project.
     * Authorization: projects.create permission (Project Manager + Super Admin).
     *
     * Only passes users with Project Manager or Super Admin roles for the Manager dropdown.
     */
    public function create(): Response
    {
        Gate::authorize('create', Project::class);

        // Hanya user dengan role project_manager yang bisa jadi PM (Super Admin excluded per spec)
        $managers = User::whereHas('roles', fn ($q) => $q->where('name', 'project_manager'))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        // Hanya user dengan role member atau client yang bisa jadi anggota tim
        $available_members = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['member', 'client']))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        return Inertia::render('Projects/Create', [
            'managers'          => $managers,
            'available_members' => $available_members,
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

        // $request->validated() already contains manager_id from StoreProjectRequest.
        Project::create($request->validated());

        return redirect()->route('projects.index')->with('success', 'Project berhasil dibuat.');
    }

    /**
     * Show a specific project.
     *
     * Anti-IDOR enforcement: Gate::authorize('view', $project) triggers
     * ProjectPolicy::view() which gates by manager_id or project_user pivot.
     *
     * Passes all users for the "Tambah Anggota" modal dropdown.
     */
    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $alreadyMemberIds = $project->members()->pluck('users.id')->toArray();
        $alreadyMemberIds[] = $project->manager_id; // Tambahkan PM agar tidak muncul di list anggota

        $available_members = User::whereNotIn('id', $alreadyMemberIds)
            ->whereHas('roles', function($q) {
                $q->whereIn('name', ['member', 'client', 'viewer']);
            })
            ->with('roles:id,name')
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        return Inertia::render('Projects/Show', [
            'project'           => $project->load(['manager', 'members']),
            'available_members' => $available_members,
        ]);
    }

    /**
     * Show the form for editing the given project.
     * Authorization: Only Super Admin or the project's own manager_id.
     *
     * Passes eligible managers for reassignment.
     */
    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        // Hanya user dengan role project_manager yang bisa jadi PM
        $managers = User::whereHas('roles', fn ($q) => $q->where('name', 'project_manager'))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        // Hanya user dengan role member atau client yang bisa jadi anggota tim
        $available_members = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['member', 'client']))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        return Inertia::render('Projects/Edit', [
            'project'           => $project->load(['manager', 'members']),
            'managers'          => $managers,
            'available_members' => $available_members,
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

        return redirect()->route('projects.show', $project)->with('success', 'Project berhasil diperbarui.');
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

        return redirect()->route('projects.index')->with('success', 'Project berhasil dihapus.');
    }

    // =========================================================================
    // MEMBER MANAGEMENT
    // =========================================================================

    /**
     * Add a member to the project.
     *
     * Authorization: Super Admin (via policy before()) or this project's manager.
     * Uses syncWithoutDetaching() to prevent duplicate key crashes.
     */
    public function addMember(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        // Prevent adding the project manager as a member
        if ((int) $request->user_id === $project->manager_id) {
            return back()->with('error', 'Project Manager sudah menjadi pemimpin project ini.');
        }

        $project->members()->syncWithoutDetaching([$request->user_id]);

        return back()->with('success', 'Anggota berhasil ditambahkan.');
    }

    /**
     * Remove a member from the project.
     *
     * Authorization: Super Admin (via policy before()) or this project's manager.
     */
    public function removeMember(Project $project, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $project->members()->detach($user->id);

        return back()->with('success', 'Anggota berhasil dihapus dari project.');
    }
}