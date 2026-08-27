<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Run order matters:
     * 1. RoleAndPermissionSeeder — must create roles before UserSeeder assigns them
     * 2. UserSeeder              — creates default users and assigns Spatie roles
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            UserSeeder::class,
        ]);
    }
}
