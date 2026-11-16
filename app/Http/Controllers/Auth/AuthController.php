<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show the login page.
     */
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Login user.
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials)) {
            return back()->withErrors([
                'email' => 'Email atau password salah.',
            ]);
        }

        $user = Auth::user();

        // Check if account has been deactivated by Super Admin
        if (! $user->is_active) {
            Auth::logout();
            return back()->withErrors([
                'email' => 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
            ]);
        }

        // Prevent session fixation attack
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return redirect()->intended(route('dashboard'))->with('success', 'Login berhasil.');
    }

    /**
     * Register a new user (Super Admin only).
     */
    public function register(RegisterRequest $request): RedirectResponse
    {
        $user = User::create([
            'username' => $request->username,
            'email'    => $request->email,
            'password' => $request->password, // Auto-hashed via model cast
        ]);

        // Assign role via Spatie
        if ($request->filled('role')) {
            $user->assignRole($request->role);
        } else {
            $user->assignRole('member'); // Default role
        }

        return back()->with('success', 'User berhasil didaftarkan.');
    }

    /**
     * Logout user.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('login')->with('success', 'Logout berhasil.');
    }

    /**
     * Get the authenticated user's profile (can remain as JSON or component if needed, 
     * but Inertia handles user via props. We'll leave it as a component just in case).
     */
    public function me(Request $request): Response
    {
        return Inertia::render('Auth/Profile', [
            'user' => $request->user()
        ]);
    }
}

