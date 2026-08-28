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

    // Project Member Management
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember'])
        ->name('projects.members.add');
    Route::delete('/projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])
        ->name('projects.members.remove');
});