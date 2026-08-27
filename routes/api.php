<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Route untuk REST API Project Management System.
| Semua route di sini otomatis memiliki prefix /api.
|
| Struktur authorization:
| - Public routes: login (tanpa auth)
| - Protected routes: semua route lain (wajib login)
| - Role-based routes: menggunakan middleware 'role:nama_role'
|
| Sanctum SPA Authentication Flow (Opsi A - Inertia):
| 1. Frontend GET /sanctum/csrf-cookie (mendapat XSRF-TOKEN cookie)
| 2. Frontend POST /api/login (dengan X-XSRF-TOKEN header)
| 3. Setelah login, semua API request authenticated via session cookie
|
*/

// =========================================================================
// PUBLIC ROUTES (tidak perlu login)
// =========================================================================
Route::post('/login', [AuthController::class, 'login'])->name('login');

// =========================================================================
// PROTECTED ROUTES (wajib login via Sanctum session/token)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // --- Auth ---
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me');

    // --- Super Admin Only ---
    Route::middleware('role:super_admin')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
    });

    // --- Super Admin & Project Manager ---
    Route::middleware('role:super_admin,project_manager')->group(function () {
        // Nanti: project CRUD, member management
    });

    // --- Semua role yang login ---
    // Nanti: view project, view task, dll sesuai policy masing-masing

});
