# MASTER ARCHITECTURE & DATABASE SPECIFICATION
**Project:** Enterprise Project Management System  
**Target Framework:** Laravel 12 (PHP 8.3+)  
**Database:** MySQL 8.0+  

---

## 1. TECH STACK & ARCHITECTURAL RULES (STRICT)

When writing code, you MUST follow these conventions:
1. **PHP 8.3+ & Laravel 12 Standards:** Use typed properties, return types, enums for statuses/priorities, and modern Laravel 12 syntax.
2. **Form Request Validation:** NEVER write `$request->validate()` inside Controllers. Every create/update action MUST use a dedicated `FormRequest` class (e.g., `StoreTaskRequest`, `UpdateProjectRequest`).
3. **Authorization via Policies:** NEVER rely solely on frontend hiding. Every destructive, update, or read action MUST pass through Laravel `Policy` classes (e.g., `ProjectPolicy`, `TaskPolicy`, `AttachmentPolicy`).
4. **Asynchronous Processing:** All email notifications, mentions, and deadline alerts MUST use Laravel Queue (`implements ShouldQueue`).
5. **Caching:** Heavy aggregations (Dashboard KPIs) MUST utilize `Cache::remember()`.
6. **Zero N+1 Query (Eager Loading):** Always eager load relationships (`with()`) for list views. All list endpoints MUST use `->paginate(15)`.

---

## 2. DATABASE SCHEMA & MIGRATIONS

### A. Core Tables

#### `users`
- `id` (BigIncrements)
- `username` (string, unique)
- `email` (string, unique)
- `password` (string)
- `timestamps()`

#### `projects`
- `id` (BigIncrements)
- `name` (string)
- `description` (text, nullable)
- `status` (enum: 'planning', 'active', 'on_hold', 'completed', 'cancelled')
- `start_date` (date)
- `end_date` (date) -> *Deadline*
- `manager_id` (foreignId -> users.id, `restrictOnDelete()`) -> *Relasi 1:N PM*
- `timestamps()`
- **Indexes:** `status`, `manager_id`

#### `tasks`
- `id` (BigIncrements)
- `project_id` (foreignId -> projects.id, `cascadeOnDelete()`)
- `parent_id` (foreignId -> tasks.id, nullable, `cascadeOnDelete()`) -> *Recursive Subtask (1:N)*
- `reporter_id` (foreignId -> users.id, `restrictOnDelete()`) -> *User who created the task*
- `title` (string)
- `description` (text, nullable)
- `status` (enum: 'backlog', 'todo', 'in_progress', 'review', 'done')
- `priority` (enum: 'low', 'medium', 'high', 'critical')
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `requires_approval` (boolean, default false)
- `position` (double, default 0) -> *Kanban Board Ordering*
- `timestamps()`
- **Indexes:** `status`, `priority`, `project_id`, `position`

#### `labels`
- `id` (BigIncrements)
- `name` (string)
- `color` (string, e.g., hex code '#FF0000')
- `timestamps()`

#### `comments`
- `id` (BigIncrements)
- `task_id` (foreignId -> tasks.id, `cascadeOnDelete()`)
- `user_id` (foreignId -> users.id, `cascadeOnDelete()`)
- `comment` (text)
- `timestamps()`

#### `task_attachments`
- `id` (BigIncrements)
- `task_id` (foreignId -> tasks.id, `cascadeOnDelete()`)
- `user_id` (foreignId -> users.id, `cascadeOnDelete()`)
- `filename` (string) -> *Display name*
- `filepath` (string) -> *Hashed Storage path*
- `filesize` (unsignedBigInteger)
- `filetype` (string) -> *MIME type*
- `timestamps()`

#### `approvals`
- `id` (BigIncrements)
- `task_id` (foreignId -> tasks.id, `cascadeOnDelete()`)
- `status` (enum: 'pending', 'approved', 'rejected', 'revision_required')
- `approved_by` (foreignId -> users.id, nullable, `nullOnDelete()`)
- `notes` (text, nullable)
- `timestamps()`

#### `activity_logs` (Audit Trail)
- `id` (BigIncrements)
- `user_id` (foreignId -> users.id, nullable, `nullOnDelete()`)
- `action` (string) -> *e.g., 'TASK_STATUS_CHANGED'*
- `entity_type` (string) -> *Polymorphic (e.g., 'App\Models\Task')*
- `entity_id` (unsignedBigInteger)
- `old_value` (json, nullable)
- `new_value` (json, nullable)
- `timestamps()`
- **Indexes:** Composite index on `['entity_type', 'entity_id']`

#### `notifications`
- Standard Laravel database notifications table (`php artisan notifications:table`).

---

### B. Pivot Tables (Many-to-Many / M:N)

#### `project_user` (Project Members)
- `project_id` (foreignId -> projects.id, `cascadeOnDelete()`)
- `user_id` (foreignId -> users.id, `cascadeOnDelete()`)
- `primary(['project_id', 'user_id'])`

#### `task_user` (Task Assignees)
- `task_id` (foreignId -> tasks.id, `cascadeOnDelete()`)
- `user_id` (foreignId -> users.id, `cascadeOnDelete()`)
- `primary(['task_id', 'user_id'])`

#### `label_task` (Task Labels)
- `task_id` (foreignId -> tasks.id, `cascadeOnDelete()`)
- `label_id` (foreignId -> labels.id, `cascadeOnDelete()`)
- `primary(['task_id', 'label_id'])`

#### `task_dependencies` (Task Blockers - Recursive M:N)
- `task_id` (foreignId -> tasks.id, `cascadeOnDelete()`) -> *The blocked task*
- `depends_on_task_id` (foreignId -> tasks.id, `cascadeOnDelete()`) -> *The blocking prerequisite task*
- `primary(['task_id', 'depends_on_task_id'])`

#### Roles & Permissions (RBAC)
- Use standard `spatie/laravel-permission` migrations.

---

### C. Seeded Roles & Permissions Matrix (STRICT LIST)

When generating `RoleAndPermissionSeeder.php`, create and assign the following exact permission strings:

#### 1. Defined Permissions:
- **Users & System:** `users.view`, `users.create`, `users.update`, `users.delete`, `roles.manage`, `permissions.manage`, `audit_logs.view`
- **Projects:** `projects.view`, `projects.create`, `projects.update`, `projects.delete`, `projects.manage_members`
- **Tasks:** `tasks.view`, `tasks.create`, `tasks.update`, `tasks.delete`, `tasks.change_status`, `tasks.assign`
- **Approvals:** `tasks.submit_review`, `tasks.approve`
- **Comments & Attachments:** `comments.create`, `comments.delete`, `attachments.upload`, `attachments.download`

#### 2. Role Assignments:
- **`Super Admin`**: Assigned ALL permissions (or global bypass via `Gate::before`).
- **`Project Manager`**: 
  - `projects.view`, `projects.create`, `projects.update`, `projects.manage_members`
  - `tasks.view`, `tasks.create`, `tasks.update`, `tasks.delete`, `tasks.change_status`, `tasks.assign`, `tasks.approve`
  - `comments.create`, `comments.delete`
  - `attachments.upload`, `attachments.download`
- **`Member`**:
  - `projects.view`
  - `tasks.view`, `tasks.change_status`, `tasks.submit_review`
  - `comments.create`
  - `attachments.upload`, `attachments.download`
- **`Viewer / Client`**:
  - `projects.view`
  - `tasks.view`
  - `attachments.download`

## 3. CORE BUSINESS LOGIC & AUTHORIZATION RULES

### 1. Task Dependency Validation
- In `TaskService` / `UpdateTaskStatusRequest`: When a Task's status is changed to `done`, query `task_dependencies`. If ANY task where `id = depends_on_task_id` has `status != 'done'`, throw a `ValidationException` with an informative error message: *"Cannot complete task because prerequisite dependencies are still unfinished."*

### 2. Secure File Upload & Download Policy
- **Upload:** Validate allowed MIME types and max size inside `StoreAttachmentRequest`. Store file via `Storage::disk('private')->put()`. Do NOT trust the client file name; hash the storage path.
- **Download:** Create route `/attachments/{attachment}/download`. Apply `AttachmentPolicy@download` which asserts: the authenticated user must be a Super Admin, the Manager of the parent Project, or a Member of the parent Project. Abort with `403 Forbidden` if unauthorized.

### 3. Project Authorization (Anti-IDOR)
- In `ProjectPolicy`: Users can only view/update a project if `user_id == project.manager_id` OR `project.members->contains(user)`. Direct access to `/projects/{id}` for non-members must return `403 Forbidden`.

### 4. Kanban Reordering
- Positions are floating-point doubles. When a task is dragged between task A (pos 1000) and task B (pos 2000), set the dragged task's position to `(1000 + 2000) / 2 = 1500`.

### 5. Audit Logging (Observer Pattern)
- Implement Model Observers (or Eloquent Events) on `Project` and `Task`. On `updated`, record `old_value` (using `$model->getOriginal()`) and `new_value` (using `$model->getChanges()`) to `activity_logs`.