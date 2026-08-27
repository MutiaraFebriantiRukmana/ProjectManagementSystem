<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * UserSeeder — Creates one default user per role for development/testing.
 *
 * REFACTORED: Removed all custom role_id FK usage.
 * Roles now assigned via Spatie's $user->assignRole() method.
 *
 * Default password: password123
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'username' => 'superadmin',
                'email'    => 'superadmin@pm.test',
                'password' => 'password123',
                'role'     => 'super_admin',
            ],
            [
                'username' => 'projectmanager',
                'email'    => 'pm@pm.test',
                'password' => 'password123',
                'role'     => 'project_manager',
            ],
            [
                'username' => 'member',
                'email'    => 'member@pm.test',
                'password' => 'password123',
                'role'     => 'member',
            ],
            [
                'username' => 'viewer',
                'email'    => 'viewer@pm.test',
                'password' => 'password123',
                'role'     => 'viewer',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'username'  => $userData['username'],
                    'password'  => $userData['password'], // Auto-hashed via model cast
                    'is_active' => true,
                ]
            );

            // Assign role via Spatie — replaces old role_id FK
            // syncRoles() ensures idempotency (safe to re-seed)
            $user->syncRoles([$role]);
        }

        $this->command->info('✅ Default users seeded with Spatie roles.');
    }
}
