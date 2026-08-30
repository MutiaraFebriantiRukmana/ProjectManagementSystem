<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

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
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Super Admin register user
    Route::middleware(['role:super_admin|Super Admin'])->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
    });

    // Projects CRUD (resource routes: index, create, store, show, edit, update, destroy)
    Route::resource('projects', ProjectController::class);

    // --- Tasks & Kanban ---
    Route::post('/tasks', [\App\Http\Controllers\TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [\App\Http\Controllers\TaskController::class, 'update'])->name('tasks.update');
    Route::patch('/tasks/{task}/status', [\App\Http\Controllers\TaskController::class, 'updateStatus'])->name('tasks.update-status');
    Route::delete('/tasks/{task}', [\App\Http\Controllers\TaskController::class, 'destroy'])->name('tasks.destroy');

    // --- Comments ---
    Route::post('/tasks/{task}/comments', [\App\Http\Controllers\CommentController::class, 'store'])->name('comments.store');
    Route::delete('/comments/{comment}', [\App\Http\Controllers\CommentController::class, 'destroy'])->name('comments.destroy');

    // --- Attachments (Secure Upload & Download) ---
    Route::post('/tasks/{task}/attachments', [\App\Http\Controllers\AttachmentController::class, 'store'])->name('attachments.store');
    Route::get('/attachments/{attachment}/download', [\App\Http\Controllers\AttachmentController::class, 'download'])->name('attachments.download');
    // Project Member Management
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember'])
        ->name('projects.members.add');
    Route::delete('/projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])
        ->name('projects.members.remove');

    // Admin Suite
    Route::middleware(['role:super_admin|Super Admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class)->except(['create', 'show', 'edit']);
        Route::get('roles', [\App\Http\Controllers\Admin\RolePermissionController::class, 'index'])->name('roles.index');
        Route::patch('roles/{role}/permissions', [\App\Http\Controllers\Admin\RolePermissionController::class, 'updatePermissions'])->name('roles.permissions.update');
    });
});