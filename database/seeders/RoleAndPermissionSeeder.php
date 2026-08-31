<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * RoleAndPermissionSeeder
 *
 * Creates all roles and granular permissions for the Enterprise PMS.
 * Spec reference: APP_SPECIFICATION.md §2.B (Roles & Permissions — Spatie)
 *                 brief.md §4 (Role definitions and access rules)
 *
 * Roles:
 *   super_admin     → All permissions via Gate::before() bypass in ProjectPolicy
 *   project_manager → Scoped permissions: manage own projects, tasks, approvals
 *   member          → Limited: view, comment, update task status, upload
 *   viewer          → Read-only access to assigned projects/tasks
 *
 * Permission Naming Convention: {resource}.{action}
 *   Readable, specific, and auditable.
 */
class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear Spatie's permission cache to prevent stale lookups during seeding
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // =====================================================================
        // 1. DEFINE ALL PERMISSIONS
        // =====================================================================

        $permissions = [
            // --- User Management ---
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // --- Project Management ---
            'projects.view',         // View a project the user has access to
            'projects.create',       // Create a new project
            'projects.update',       // Update project details
            'projects.delete',       // Delete a project (Super Admin only)
            'projects.manage_members', // Add/remove members

            // --- Task Management ---
            'tasks.view',            // View tasks in accessible projects
            'tasks.create',          // Create tasks
            'tasks.update',          // Update task details (PM/SA)
            'tasks.change_status',   // Change task status (Member)
            'tasks.delete',          // Delete tasks
            'tasks.assign',          // Assign tasks to users
            'tasks.submit_review',   // Submit task for review (Member)
            'tasks.approve',         // Approve/reject tasks (PM/SA)

            // --- Attachments ---
            'attachments.upload',    // Upload attachments to tasks
            'attachments.download',  // Download attachments
            'attachments.delete',    // Delete attachments

            // --- Comments ---
            'comments.create',       // Post a comment
            'comments.update',       // Edit own comment
            'comments.delete',       // Delete comment
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // =====================================================================
        // 2. DEFINE ROLES AND ASSIGN PERMISSIONS
        // =====================================================================

        // --- SUPER ADMIN ---
        // Bypass strategy: Super Admin gets all permissions via Gate::before()
        // in ProjectPolicy. We also explicitly assign all permissions here
        // for auditability and Spatie's $user->can() checks.
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // --- PROJECT MANAGER ---
        // Can manage projects they are assigned to. Cannot access other projects.
        // brief.md §4: "Project Manager tidak boleh otomatis memiliki akses terhadap seluruh project"
        $projectManager = Role::firstOrCreate(['name' => 'project_manager', 'guard_name' => 'web']);
        $projectManager->syncPermissions([
            'projects.view',
            'projects.create',
            'projects.update',
            'projects.manage_members',
            'tasks.view',
            'tasks.create',
            'tasks.update',
            'tasks.change_status',
            'tasks.delete',
            'tasks.assign',
            'tasks.submit_review',
            'tasks.approve',
            'attachments.upload',
            'attachments.download',
            'attachments.delete',
            'comments.create',
            'comments.update',
            'comments.delete',
        ]);

        // --- MEMBER ---
        // brief.md §4: Can view assigned projects/tasks, update task status,
        //              comment, upload attachments, submit for review.
        //              CANNOT: access other projects, change permissions, DELETE projects.
        $member = Role::firstOrCreate(['name' => 'member', 'guard_name' => 'web']);
        $member->syncPermissions([
            'projects.view',
            'tasks.view',
            'tasks.change_status',  // Can change own task status
            'tasks.submit_review',  // Can submit for review
            'attachments.upload',
            'attachments.download',
            'comments.create',
            'comments.update',
            'comments.delete',
        ]);

        // --- VIEWER / CLIENT ---
        // brief.md §4: Read-only access to specific projects/tasks/activity.
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions([
            'projects.view',
            'tasks.view',
            'attachments.download',
            'comments.create',      // Viewers can comment per brief
        ]);

        $this->command->info('✅ Roles and permissions seeded successfully.');
        $this->command->table(
            ['Role', 'Permissions Count'],
            [
                ['super_admin',     Permission::count()],
                ['project_manager', $projectManager->permissions()->count()],
                ['member',          $member->permissions()->count()],
                ['viewer',          $viewer->permissions()->count()],
            ]
        );
    }
}
