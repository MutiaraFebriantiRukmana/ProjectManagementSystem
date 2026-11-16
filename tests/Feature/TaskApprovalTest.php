<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_member_can_submit_task_for_review(): void
    {
        $pm = User::factory()->create();
        $pm->assignRole('project_manager');

        $member = User::factory()->create();
        $member->assignRole('member');

        $project = Project::create([
            'name' => 'Project Alpha',
            'manager_id' => $pm->id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]);
        $project->members()->attach($member->id);

        $task = Task::create([
            'project_id' => $project->id,
            'reporter_id' => $pm->id,
            'title' => 'Feature Auth',
            'status' => 'in_progress',
            'priority' => 'high',
            'requires_approval' => true,
        ]);

        $response = $this->actingAs($member)->post("/tasks/{$task->id}/submit-review", [
            'notes' => 'Siap direview',
        ]);

        $response->assertRedirect();
        $this->assertEquals('review', $task->fresh()->status);
        $this->assertDatabaseHas('approvals', [
            'task_id' => $task->id,
            'status'  => 'pending',
        ]);
    }

    public function test_pm_can_approve_task_and_mark_done(): void
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

        $task = Task::create([
            'project_id' => $project->id,
            'reporter_id' => $pm->id,
            'title' => 'Feature Auth',
            'status' => 'review',
            'priority' => 'high',
            'requires_approval' => true,
        ]);

        $response = $this->actingAs($pm)->post("/tasks/{$task->id}/approve", [
            'notes' => 'Kodingan bagus, disetujui.',
        ]);

        $response->assertRedirect();
        $this->assertEquals('done', $task->fresh()->status);
        $this->assertDatabaseHas('approvals', [
            'task_id'     => $task->id,
            'approved_by' => $pm->id,
            'status'      => 'approved',
        ]);
    }
}