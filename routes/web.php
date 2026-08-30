<?php

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// =========================================================================
// PUBLIC ROUTES
// =========================================================================
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

// =========================================================================
// PROTECTED ROUTES (Session Auth)
// =========================================================================
Route::middleware(['auth', 'verified'])->group(function () {
    
    // --- Auth ---
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me');

    // --- Dashboard ---
    Route::get('/dashboard', function () {
        // Menggunakan Auth::user() dan Fully Qualified DocBlock agar Intelephense tidak merah
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Cache agregasi berat selama 60 detik per user
        $stats = Cache::remember("dashboard_stats_user_{$user->id}", 60, function () use ($user) {
            $isSuperAdmin = $user->hasRole('super_admin');

            // Scope project yang bisa diakses user
            $projectQuery = Project::query();
            if (!$isSuperAdmin) {
                $projectQuery->where(function ($q) use ($user) {
                    $q->where('manager_id', $user->id)
                      ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
                });
            }
            $projectIds = (clone $projectQuery)->pluck('id');

            $tasksQuery = Task::whereIn('project_id', $projectIds);

            $totalTasks = (clone $tasksQuery)->count();
            $completedTasks = (clone $tasksQuery)->where('status', 'done')->count();

            return [
                'total_users'       => User::count(),
                'total_projects'    => (clone $projectQuery)->count(),
                'active_projects'   => (clone $projectQuery)->where('status', 'active')->count(),
                'total_tasks'       => $totalTasks,
                'completed_tasks'   => $completedTasks,
                'pending_tasks'     => (clone $tasksQuery)->whereIn('status', ['todo', 'backlog'])->count(),
                'in_progress_tasks' => (clone $tasksQuery)->where('status', 'in_progress')->count(),
                'review_tasks'      => (clone $tasksQuery)->where('status', 'review')->count(),
                'audit_logs_count'  => ActivityLog::count(),
                'completion_rate'   => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
            ];
        });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
        ]);
    })->name('dashboard');

    // --- Super Admin Register User ---
    Route::middleware(['role:super_admin|Super Admin'])->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
    });

    // --- Projects CRUD ---
    Route::resource('projects', ProjectController::class);

    // --- Project Member Management ---
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember'])->name('projects.members.add');
    Route::delete('/projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])->name('projects.members.remove');

    // --- Tasks & Kanban ---
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.update-status');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    // --- Comments ---
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // --- Attachments (Secure Upload & Download) ---
// --- Attachments (Secure Upload & Download) ---
    Route::post('/tasks/{task}/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download'])->name('attachments.download');

    // --- Project Member Management ---
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember'])->name('projects.members.add');
    Route::delete('/projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])->name('projects.members.remove');

    // --- Approval Workflow (Poin 10 Brief) ---
    Route::post('/tasks/{task}/submit-review', [ApprovalController::class, 'submitReview'])->name('tasks.submit-review');
    Route::post('/tasks/{task}/approve', [ApprovalController::class, 'approve'])->name('tasks.approve');
    Route::post('/tasks/{task}/reject', [ApprovalController::class, 'reject'])->name('tasks.reject');

    // --- Notifications (Poin 13 Brief) ---
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // --- Admin Suite (Kelola User & Role dari Temanmu) ---
    Route::middleware(['role:super_admin|Super Admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class)->except(['create', 'show', 'edit']);
        Route::get('roles', [\App\Http\Controllers\Admin\RolePermissionController::class, 'index'])->name('roles.index');
        Route::patch('roles/{role}/permissions', [\App\Http\Controllers\Admin\RolePermissionController::class, 'updatePermissions'])->name('roles.update-permissions');
    });
});