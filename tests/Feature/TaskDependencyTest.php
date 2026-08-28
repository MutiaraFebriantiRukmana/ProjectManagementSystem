<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TaskDependencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_task_cannot_be_marked_done_if_prerequisite_is_unfinished(): void
    {
        $pm = User::factory()->create();
        $pm->assignRole('project_manager');

        $project = Project::create([
            'name' => 'Project Alpha',
            'manager_id' => $pm->id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        // Task A (Prerequisite - Status Todo)
        $taskA = Task::create([
            'project_id' => $project->id,
            'reporter_id' => $pm->id,
            'title' => 'Task A (API Schema)',
            'status' => 'todo',
            'priority' => 'high',
        ]);

        // Task B (Bergantung pada Task A)
        $taskB = Task::create([
            'project_id' => $project->id,
            'reporter_id' => $pm->id,
            'title' => 'Task B (Frontend Integration)',
            'status' => 'todo',
            'priority' => 'medium',
        ]);

        // Hubungkan dependency: Task B bergantung pada Task A
        $taskB->dependencies()->attach($taskA->id);

        $taskService = new TaskService();

        // Expect validation exception saat mencoba mengubah Task B ke 'done'
        $this->expectException(ValidationException::class);
        $taskService->updateStatus($taskB, 'done');
    }

    public function test_task_can_be_marked_done_when_all_dependencies_are_done(): void
    {
        $pm = User::factory()->create();
        $pm->assignRole('project_manager');

        $project = Project::create([
            'name' => 'Project Alpha',
            'manager_id' => $pm->id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        $taskA = Task::create([
            'project_id' => $project->id,
            'reporter_id' => $pm->id,
            'title' => 'Task A (API Schema)',
            'status' => 'done', // SUDAH SELESAI
            'priority' => 'high',
        ]);

        $taskB = Task::create([
            'project_id' => $project->id,
            'reporter_id' => $pm->id,
            'title' => 'Task B (Frontend Integration)',
            'status' => 'in_progress',
            'priority' => 'medium',
        ]);

        $taskB->dependencies()->attach($taskA->id);

        $taskService = new TaskService();
        $updatedTask = $taskService->updateStatus($taskB, 'done');

        $this->assertEquals('done', $updatedTask->status);
    }
}