<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder untuk membuat user default untuk setiap role.
 * Semua user default menggunakan password: password123
 * Jalankan: php artisan db:seed --class=UserSeeder
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('role_name', Role::SUPER_ADMIN)->first();
        $pmRole = Role::where('role_name', Role::PROJECT_MANAGER)->first();
        $memberRole = Role::where('role_name', Role::MEMBER)->first();
        $clientRole = Role::where('role_name', Role::CLIENT)->first();

        // Super Admin default
        User::updateOrCreate(
            ['email' => 'superadmin@pm.test'],
            [
                'username' => 'superadmin',
                'password' => 'password123', // Auto-hashed via model cast
                'role_id'  => $superAdminRole->role_id,
            ]
        );

        // Project Manager default
        User::updateOrCreate(
            ['email' => 'pm@pm.test'],
            [
                'username' => 'projectmanager',
                'password' => 'password123',
                'role_id'  => $pmRole->role_id,
            ]
        );

        // Member default
        User::updateOrCreate(
            ['email' => 'member@pm.test'],
            [
                'username' => 'member',
                'password' => 'password123',
                'role_id'  => $memberRole->role_id,
            ]
        );

        // Client default
        User::updateOrCreate(
            ['email' => 'client@pm.test'],
            [
                'username' => 'client',
                'password' => 'password123',
                'role_id'  => $clientRole->role_id,
            ]
        );
    }
}
