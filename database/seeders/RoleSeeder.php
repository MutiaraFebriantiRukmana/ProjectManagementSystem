<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * Seeder untuk 4 role utama aplikasi.
 * Jalankan: php artisan db:seed --class=RoleSeeder
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'role_name'    => Role::SUPER_ADMIN,
                'display_name' => 'Super Admin',
                'description'  => 'Memiliki akses penuh terhadap sistem. Dapat mengelola user, role, permission, dan mengakses seluruh project.',
            ],
            [
                'role_name'    => Role::PROJECT_MANAGER,
                'display_name' => 'Project Manager',
                'description'  => 'Bertanggung jawab terhadap project tertentu. Dapat membuat project, mengelola anggota, task, dan melakukan approval.',
            ],
            [
                'role_name'    => Role::MEMBER,
                'display_name' => 'Member',
                'description'  => 'Dapat melihat dan mengerjakan task pada project yang diikuti. Dapat membuat komentar dan mengunggah attachment.',
            ],
            [
                'role_name'    => Role::CLIENT,
                'display_name' => 'Client',
                'description'  => 'Hak akses terbatas. Dapat melihat progress dan activity pada project tertentu.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['role_name' => $role['role_name']],
                $role
            );
        }
    }
}
