<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DashboardController
 *
 * Provides stats and role-scoped project data to Dashboard.tsx.
 * Super Admin: only stats (no project table — they use /projects instead).
 * Project Manager: projects where manager_id === auth()->id().
 * Member: projects the user is attached to via project_user pivot.
 */
class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user   = auth()->user();
        $status = $request->query('status');

        $stats = [
            'total_users'       => User::count(),
            'total_projects'    => Project::count(),
            'active_projects'   => Project::where('status', 'active')->count(),
            'completed_tasks'   => 0,
            'pending_tasks'     => 0,
            'in_progress_tasks' => 0,
        ];

        $projects = collect();

        if ($user->isProjectManager()) {
            $query = Project::with(['manager'])
                ->where('manager_id', $user->id);

            if ($status && in_array($status, ['planning', 'active', 'on_hold', 'completed', 'cancelled'])) {
                $query->where('status', $status);
            }

            $projects = $query->latest()->get();

        } elseif ($user->isMember()) {
            $query = $user->memberProjects()->with(['manager']);

            if ($status && in_array($status, ['planning', 'active', 'on_hold', 'completed', 'cancelled'])) {
                $query->where('projects.status', $status);
            }

            $projects = $query->latest('projects.created_at')->get();
        }

        return Inertia::render('Dashboard', [
            'stats'    => $stats,
            'projects' => $projects,
            'filters'  => [
                'status' => $status ?? '',
            ],
        ]);
    }
}
