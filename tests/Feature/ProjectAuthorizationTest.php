<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * ProjectAuthorizationTest
 *
 * Verifies backend Anti-IDOR authorization for the /projects/{project} endpoint.
 */
class ProjectAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    /**
     * An unauthenticated (guest) user cannot access any project endpoint.
     * Expected: 302 Redirect to Login (web auth middleware).
     */
    public function test_unauthenticated_user_cannot_access_project(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('project_manager');
        $project = Project::factory()->managedBy($manager)->create();

        $response = $this->get("/projects/{$project->id}");

        $response->assertRedirect(route('login'));
    }

    /**
     * A member who belongs to Project A CANNOT access Project B.
     * Expected: 403 Forbidden.
     */
    public function test_member_of_project_a_cannot_access_project_b(): void
    {
        $managerA = User::factory()->create();
        $managerA->assignRole('project_manager');
        $managerB = User::factory()->create();
        $managerB->assignRole('project_manager');

        $projectA = Project::factory()->managedBy($managerA)->create();
        $projectB = Project::factory()->managedBy($managerB)->create();

        $member = User::factory()->create();
        $member->assignRole('member');
        $projectA->members()->attach($member->id);

        $response = $this->actingAs($member)->get("/projects/{$projectB->id}");

        $response->assertForbidden();
    }

    /**
     * A member who belongs to Project A CAN access Project A.
     * Expected: 200 OK and returns Inertia component.
     */
    public function test_member_of_project_a_can_access_project_a(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('project_manager');
        $projectA = Project::factory()->managedBy($manager)->create();

        $member = User::factory()->create();
        $member->assignRole('member');
        $projectA->members()->attach($member->id);

        $response = $this->actingAs($member)->get("/projects/{$projectA->id}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Show')
                ->has('project')
            );
    }

    /**
     * A member (even one assigned to the project) CANNOT delete the project.
     * Expected: 403 Forbidden.
     */
    public function test_member_cannot_delete_project(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('project_manager');
        $project = Project::factory()->managedBy($manager)->create();

        $member = User::factory()->create();
        $member->assignRole('member');
        $project->members()->attach($member->id);

        $response = $this->actingAs($member)->delete("/projects/{$project->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    /**
     * A Project Manager can access their own projects.
     * Expected: 200 OK and returns Inertia component.
     */
    public function test_project_manager_can_access_their_own_project(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('project_manager');
        $project = Project::factory()->managedBy($manager)->create();

        $response = $this->actingAs($manager)->get("/projects/{$project->id}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Show')
            );
    }

    /**
     * A Project Manager CANNOT access projects managed by another PM.
     * Expected: 403 Forbidden.
     */
    public function test_project_manager_cannot_access_other_managers_project(): void
    {
        $manager1 = User::factory()->create();
        $manager1->assignRole('project_manager');
        $manager2 = User::factory()->create();
        $manager2->assignRole('project_manager');

        $project = Project::factory()->managedBy($manager1)->create();

        $response = $this->actingAs($manager2)->get("/projects/{$project->id}");

        $response->assertForbidden();
    }

    /**
     * Super Admin can access any project regardless of membership.
     * Expected: 200 OK and returns Inertia component.
     */
    public function test_super_admin_can_access_any_project(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('project_manager');
        $project = Project::factory()->managedBy($manager)->create();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super_admin');

        $response = $this->actingAs($superAdmin)->get("/projects/{$project->id}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Show')
            );
    }

    /**
     * Super Admin CAN delete a project.
     * Expected: Redirects to index with success.
     */
    public function test_super_admin_can_delete_project(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('project_manager');
        $project = Project::factory()->managedBy($manager)->create();

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super_admin');

        $response = $this->actingAs($superAdmin)->delete("/projects/{$project->id}");

        $response->assertRedirect(route('projects.index'));
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }
}

