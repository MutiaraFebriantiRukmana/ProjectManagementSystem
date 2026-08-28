<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Project;

// Public Routes
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Session Auth)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me');

    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard', [
            'stats' => [
                'total_users'     => User::count(),
                'total_projects'  => Project::count(),
                'active_projects' => Project::where('status', 'active')->count(),
                'completed_tasks' => 0, // Siap menampung Task::where('status', 'done')->count() nanti
                'pending_tasks'   => 0,
                'in_progress_tasks' => 0,
            ],
        ]);
    })->name('dashboard');

    // Super Admin register user
    Route::middleware(['role:super_admin|Super Admin'])->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
    });

    // Projects CRUD
    Route::resource('projects', ProjectController::class);
});