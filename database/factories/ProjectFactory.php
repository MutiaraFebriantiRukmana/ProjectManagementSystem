<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'        => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status'      => fake()->randomElement(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
            'start_date'  => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'end_date'    => fake()->dateTimeBetween('+1 month', '+6 months')->format('Y-m-d'),
            'manager_id'  => User::factory(),
        ];
    }

    /**
     * Set a specific manager.
     */
    public function managedBy(User $manager): static
    {
        return $this->state(fn (array $attributes) => [
            'manager_id' => $manager->id,
        ]);
    }

    /**
     * Set status to active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }
}
