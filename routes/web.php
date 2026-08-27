<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    // If not logged in, you could redirect to login, or show a welcome page.
    return Inertia::render('Welcome');
})->name('home');

// =========================================================================
// PUBLIC ROUTES (no authentication required)
// =========================================================================
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

// =========================================================================
// PROTECTED ROUTES (require web session authentication)
// =========================================================================
Route::middleware(['auth', 'verified'])->group(function () {
    // --- Auth ---
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me'); // Keep this if frontend needs it, but Inertia props pass it anyway

    // --- User registration (Super Admin only via Spatie role middleware) ---
    Route::middleware(['role:super_admin'])->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
    });

    // --- Projects ---
    Route::resource('projects', ProjectController::class);
});
