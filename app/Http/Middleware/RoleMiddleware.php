<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Memvalidasi apakah user yang login memiliki salah satu role
     * yang diizinkan untuk mengakses route ini.
     *
     * Penggunaan di route: middleware('role:super_admin,project_manager')
     *
     * @param  string  $roles  Comma-separated list of allowed role names
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Silakan login terlebih dahulu.',
            ], 401);
        }

        // Load role jika belum di-load
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        // Cek apakah role user termasuk dalam daftar role yang diizinkan
        if (!$user->role || !in_array($user->role->role_name, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk tindakan ini.',
            ], 403);
        }

        return $next($request);
    }
}
