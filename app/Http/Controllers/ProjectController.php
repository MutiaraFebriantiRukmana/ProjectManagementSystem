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
 * ProjectController — Unified Version
 * Menggabungkan UI Project Temanmu + Task Backend & Eager Loading Buatanmu.
 */
class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user   = $request->user();
        $search = $request->query('search');
        $status = $request->query('status');

        $query = Project::with(['manager', 'members']);

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

    public function create(): Response
    {
        Gate::authorize('create', Project::class);

        $managers = User::whereHas('roles', fn ($q) => $q->where('name', 'project_manager'))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        $available_members = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['member', 'client']))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

        return Inertia::render('Projects/Create', [
            'managers'          => $managers,
            'available_members' => $available_members,
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Gate::authorize('create', Project::class);

        Project::create($request->validated());

        return redirect()->route('projects.index')->with('success', 'Project berhasil dibuat.');
    }

    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $alreadyMemberIds = $project->members()->pluck('users.id')->toArray();
        $alreadyMemberIds[] = $project->manager_id;

        $available_members = User::whereNotIn('id', $alreadyMemberIds)
            ->whereHas('roles', function($q) {
                $q->whereIn('name', ['member', 'client', 'viewer']);
            })
            ->with('roles:id,name')
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

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
            'available_members' => $available_members,
            'labels'            => Label::all(),
        ]);
    }

    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        $managers = User::whereHas('roles', fn ($q) => $q->where('name', 'project_manager'))
            ->select('id', 'username', 'email')
            ->orderBy('username')
            ->get();

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

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return redirect()->route('projects.show', $project)->with('success', 'Project berhasil diperbarui.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project berhasil dihapus.');
    }

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

    public function removeMember(Project $project, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $project->members()->detach($user->id);

        return back()->with('success', 'Anggota berhasil dihapus dari project.');
    }
}