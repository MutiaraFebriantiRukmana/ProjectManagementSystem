<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('tasks')->cascadeOnDelete(); // Recursive 1:N Subtask
            $table->foreignId('reporter_id')->constrained('users')->restrictOnDelete(); // Pembuat Task
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['backlog', 'todo', 'in_progress', 'review', 'done'])->default('todo');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable(); // Deadline
            $table->boolean('requires_approval')->default(false);
            $table->double('position')->default(0); // Kanban Ordering
            $table->timestamps();

            // B-Tree Indexes untuk Performa Filter & Kanban (Brief Poin 16 & 20)
            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'priority']);
            $table->index('position');
        });

        // Pivot Table Assignee (Many-to-Many User & Task)
        Schema::create('task_user', function (Blueprint $table) {
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['task_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_user');
        Schema::dropIfExists('tasks');
    }
};