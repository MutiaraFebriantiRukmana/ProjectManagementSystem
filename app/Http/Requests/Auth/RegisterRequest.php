<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * RegisterRequest — Validates new user registration.
 *
 * Only reachable by Super Admin (enforced by role:super_admin middleware).
 * This FormRequest validates the data; Spatie middleware enforces who can call this.
 *
 * REFACTORED: Replaced role_id (integer FK) with role (string) — Spatie role name.
 */
class RegisterRequest extends FormRequest
{
    /**
     * Authorization handled by the role:super_admin middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'email'    => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role'     => ['nullable', 'string', 'in:super_admin,project_manager,member,viewer'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required'   => 'Username wajib diisi.',
            'username.unique'     => 'Username sudah digunakan.',
            'email.required'      => 'Email wajib diisi.',
            'email.unique'        => 'Email sudah terdaftar.',
            'password.required'   => 'Password wajib diisi.',
            'password.min'        => 'Password minimal 8 karakter.',
            'password.confirmed'  => 'Konfirmasi password tidak sesuai.',
            'role.in'             => 'Role tidak valid. Pilihan: super_admin, project_manager, member, viewer.',
        ];
    }
}
