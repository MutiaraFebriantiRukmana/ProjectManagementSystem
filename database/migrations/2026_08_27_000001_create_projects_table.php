<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `projects` table and `project_user` pivot table.
 * Spec reference: APP_SPECIFICATION.md §2.A (projects) and §2.B (project_user)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();                                       // BigIncrements 'id' per spec
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])
                  ->default('planning');
            $table->date('start_date');
            $table->date('end_date');                           // Deadline per spec
            $table->foreignId('manager_id')                    // FK → users.id, 1:N PM relation
                  ->constrained('users')
                  ->restrictOnDelete();
            $table->timestamps();

            // Spec-required indexes
            $table->index('status');
            $table->index('manager_id');
        });

        // project_user pivot — M:N project members
        Schema::create('project_user', function (Blueprint $table) {
            $table->foreignId('project_id')
                  ->constrained('projects')
                  ->cascadeOnDelete();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->primary(['project_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_user');
        Schema::dropIfExists('projects');
    }
};
