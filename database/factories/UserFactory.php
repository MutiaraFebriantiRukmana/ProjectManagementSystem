<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 *
 * REFACTORED: Removed role_id FK — roles now managed by Spatie.
 * Use ->withRole('project_manager') after factory creation to assign roles.
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'username'       => fake()->unique()->userName(),
            'email'          => fake()->unique()->safeEmail(),
            'password'       => static::$password ??= Hash::make('password'),
            'is_active'      => true,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Assign a Spatie role to the created user.
     *
     * Note: Spatie roles are assigned AFTER model creation via afterCreating()
     * callback because they require the model to exist in the DB first.
     *
     * Usage:
     *   User::factory()->withRole('project_manager')->create();
     */
    public function withRole(string $roleName): static
    {
        return $this->afterCreating(function (User $user) use ($roleName) {
            $user->assignRole($roleName);
        });
    }

    /**
     * Set user as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
