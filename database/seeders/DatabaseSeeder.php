<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Label;

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

        $labels = [
            ['name' => 'Frontend', 'color' => '#3B82F6'], // Biru
            ['name' => 'Backend',  'color' => '#10B981'], // Hijau
            ['name' => 'UI/UX',    'color' => '#8B5CF6'], // Ungu
            ['name' => 'Bug',      'color' => '#EF4444'], // Merah
            ['name' => 'Feature',  'color' => '#F59E0B'], // Kuning
        ];

        foreach ($labels as $label) {
            Label::firstOrCreate(['name' => $label['name']], $label);
        }
    }
}
