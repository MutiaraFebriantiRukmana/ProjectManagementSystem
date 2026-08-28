<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Label;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProjectController — Unified Version (Project UI + Member Management + Task Engine)
 *
 * All authorization is enforced via ProjectPolicy (Gate::authorize()).
 * Anti-IDOR enforcement layer active on backend.
 */
class ProjectController extends Controller
{
    /**
     * 1. LIST PROJECTS (Dengan Search, Status Filter & Pagination)
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user   = $request->user();
        $search = $request->query('search');
        $status = $request->query('status');

        $query = Project::with(['manager', 'members']);

        // Super Admin melihat semua, PM/Member hanya melihat project terkait
        if (! $user->hasRole('super_admin')) {
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
     * 2. FORM CREATE PROJECT (Dropdown Manager khusus PM & Super Admin)
     */
    public function create(): Response
    {
        Gate::authorize('create', Project::class);

        $managers = User::role(['project_manager', 'super_admin'])
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        return Inertia::render('Projects/Create', [
            'managers' => $managers,
        ]);
    }

    /**
     * 3. STORE PROJECT
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Gate::authorize('create', Project::class);

        Project::create($request->validated());

        return redirect()->route('projects.index')->with('success', 'Project berhasil dibuat.');
    }

    /**
     * 4. DETAIL PROJECT & KANBAN (Eager Loading Task Lengkap + Data Member)
     */
    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        return Inertia::render('Projects/Show', [
            'project' => $project->load([
                'manager', 
                'members', 
                'tasks.assignees', 
                'tasks.labels', 
                'tasks.dependencies', 
                'tasks.subtasks', 
                'tasks.attachments', 
                'tasks.comments.user'
            ]),
            'users'  => User::select('id', 'username', 'email')->orderBy('username')->get(),
            'labels' => Label::all(),
        ]);
    }

    /**
     * 5. FORM EDIT PROJECT
     */
    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        $managers = User::role(['project_manager', 'super_admin'])
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        return Inertia::render('Projects/Edit', [
            'project'  => $project->load(['manager', 'members']),
            'managers' => $managers,
        ]);
    }

    /**
     * 6. UPDATE PROJECT
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return redirect()->route('projects.show', $project)->with('success', 'Project berhasil diperbarui.');
    }

    /**
     * 7. DELETE PROJECT (Super Admin Only)
     */
    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project berhasil dihapus.');
    }

    // =========================================================================
    // MEMBER MANAGEMENT (Fitur Poin 6 Brief)
    // =========================================================================

    /**
     * 8. TAMBAH MEMBER PROJECT
     */
    public function addMember(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        if ((int) $request->user_id === $project->manager_id) {
            return back()->with('error', 'Project Manager sudah menjadi pemimpin project ini.');
        }

        $project->members()->syncWithoutDetaching([$request->user_id]);

        return back()->with('success', 'Anggota berhasil ditambahkan.');
    }

    /**
     * 9. HAPUS MEMBER PROJECT
     */
    public function removeMember(Project $project, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $project->members()->detach($user->id);

        return back()->with('success', 'Anggota berhasil dihapus dari project.');
    }
}