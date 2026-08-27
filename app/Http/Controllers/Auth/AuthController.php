<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Login user.
     *
     * Alur:
     * 1. Validasi input via LoginRequest (Form Request).
     * 2. Cek kredensial (email + password).
     * 3. Cek apakah akun aktif (is_active).
     * 4. Jika berhasil, regenerate session untuk mencegah session fixation attack.
     * 5. Return user data beserta role-nya.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        // Cek kredensial menggunakan Auth facade
        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        $user = Auth::user();

        // Cek apakah akun dinonaktifkan oleh Super Admin
        if (!$user->is_active) {
            Auth::logout();
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
            ], 403);
        }

        // Regenerate session ID untuk mencegah session fixation attack
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Eager load role untuk response
        $user->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'user' => [
                    'user_id'   => $user->user_id,
                    'username'  => $user->username,
                    'email'     => $user->email,
                    'role'      => [
                        'role_id'      => $user->role->role_id,
                        'role_name'    => $user->role->role_name,
                        'display_name' => $user->role->display_name,
                    ],
                    'is_active'  => $user->is_active,
                    'created_at' => $user->created_at,
                ],
            ],
        ], 200);
    }

    /**
     * Register user baru (hanya Super Admin).
     *
     * Authorization dilakukan di RegisterRequest::authorize().
     * Password di-hash otomatis melalui User model cast 'hashed'.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'username' => $request->username,
            'email'    => $request->email,
            'password' => $request->password, // Auto-hashed via cast
            'role_id'  => $request->role_id,
        ]);

        $user->load('role');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil didaftarkan.',
            'data'    => [
                'user' => [
                    'user_id'   => $user->user_id,
                    'username'  => $user->username,
                    'email'     => $user->email,
                    'role'      => [
                        'role_id'      => $user->role->role_id,
                        'role_name'    => $user->role->role_name,
                        'display_name' => $user->role->display_name,
                    ],
                    'is_active'  => $user->is_active,
                    'created_at' => $user->created_at,
                ],
            ],
        ], 201);
    }

    /**
     * Logout user.
     *
     * 1. Invalidate session saat ini.
     * 2. Regenerate CSRF token.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ], 200);
    }

    /**
     * Get data user yang sedang login beserta role-nya.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Data user berhasil diambil.',
            'data'    => [
                'user' => [
                    'user_id'    => $user->user_id,
                    'username'   => $user->username,
                    'email'      => $user->email,
                    'role'       => [
                        'role_id'      => $user->role->role_id,
                        'role_name'    => $user->role->role_name,
                        'display_name' => $user->role->display_name,
                    ],
                    'is_active'  => $user->is_active,
                    'created_at' => $user->created_at,
                ],
            ],
        ], 200);
    }
}
