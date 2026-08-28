# Project Management System

## 1. Ringkasan Sistem

Project Management System adalah aplikasi web internal untuk autentikasi pengguna, pengaturan role dan permission, serta pengelolaan project. Implementasi saat ini menggunakan:

- Laravel 12 dan PHP 8.2+ pada backend.
- Inertia.js sebagai jembatan server-side Laravel ke frontend.
- React dan TypeScript pada frontend.
- Eloquent ORM dan migration Laravel untuk persistence.
- Spatie Laravel Permission untuk RBAC.
- Session authentication untuk alur web.
- PHPUnit untuk feature test.

Arsitektur yang benar-benar digunakan saat ini adalah **Laravel monolith dengan Inertia**, bukan REST API terpisah. File `routes/api.php` hanya berisi komentar bahwa route API dipindahkan ke `routes/web.php`.

Dokumen ini memisahkan kemampuan yang sudah tersedia dari kemampuan yang baru didefinisikan di spesifikasi agar status proyek tidak keliru dibaca sebagai fitur selesai.

## 2. Struktur Folder Aktual

```text
ProjectManagementSystem/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/AuthController.php
│   │   │   ├── Controller.php
│   │   │   └── ProjectController.php
│   │   ├── Middleware/
│   │   │   └── HandleInertiaRequests.php
│   │   └── Requests/
│   │       ├── Auth/LoginRequest.php
│   │       ├── Auth/RegisterRequest.php
│   │       ├── StoreProjectRequest.php
│   │       └── UpdateProjectRequest.php
│   ├── Models/
│   │   ├── Project.php
│   │   └── User.php
│   ├── Policies/ProjectPolicy.php
│   └── Providers/AppServiceProvider.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── auth.php
│   ├── database.php
│   ├── inertia.php
│   ├── permission.php
│   └── ...
├── database/
│   ├── factories/ProjectFactory.php, UserFactory.php
│   ├── migrations/
│   │   ├── users, sessions, password reset tokens
│   │   ├── projects dan project_user
│   │   └── tabel RBAC Spatie
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RoleAndPermissionSeeder.php
│       ├── RoleSeeder.php
│       └── UserSeeder.php
├── resources/
│   ├── css/app.css
│   ├── js/
│   │   ├── app.tsx
│   │   ├── bootstrap.ts
│   │   ├── Layouts/AuthenticatedLayout.tsx
│   │   ├── Pages/
│   │   │   ├── Auth/{Login,Profile}.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Projects/Show.tsx
│   │   └── types/index.d.ts
│   └── views/app.blade.php
├── routes/web.php
├── routes/api.php
├── tests/
│   ├── Feature/AuthTest.php
│   ├── Feature/ProjectAuthorizationTest.php
│   └── Unit/ExampleTest.php
├── public/build/
├── storage/
├── composer.json
├── package.json
└── app_specification.md / brief.md
```

### Struktur target yang disarankan

Struktur berikut cocok untuk melanjutkan spesifikasi tanpa mengubah fondasi Inertia yang sudah ada:

```text
app/
├── Actions/                    # Use case kecil: create project, assign member, update status
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Projects/
│   │   ├── Tasks/
│   │   ├── Attachments/
│   │   └── Admin/
│   ├── Requests/{Auth,Projects,Tasks,Attachments}/
│   └── Resources/              # Bentuk data konsisten untuk Inertia/API
├── Jobs/                       # Notifikasi, deadline alert, pekerjaan async
├── Models/                     # Project, Task, Comment, Attachment, Approval, ActivityLog
├── Notifications/
├── Observers/                  # Audit Project dan Task
├── Policies/                   # Policy per resource
├── Services/                   # Aturan lintas model, misalnya dependency task
└── Support/                    # Enum, helper, dan kontrak umum

resources/js/
├── Components/
├── Layouts/
├── Pages/
│   ├── Auth/
│   ├── Dashboard/
│   ├── Projects/
│   ├── Tasks/
│   └── Admin/
├── types/
└── lib/

database/
├── factories/
├── migrations/
└── seeders/
```

Struktur target adalah rekomendasi organisasi kode; folder tersebut belum seluruhnya tersedia.

## 3. Alur Kerja Sistem Saat Ini

### 3.1 Bootstrap dan render halaman

```mermaid
flowchart LR
    Browser --> Web[Laravel routes/web.php]
    Web --> Middleware[auth, verified, Spatie role]
    Middleware --> Controller[Controller atau closure]
    Controller --> Policy[Gate / ProjectPolicy]
    Policy --> Inertia[Inertia::render]
    Inertia --> Blade[resources/views/app.blade.php]
    Blade --> React[React Page di resources/js/Pages]
```

`resources/js/app.tsx` mencari page berdasarkan nama komponen Inertia, misalnya `Projects/Show` menjadi `resources/js/Pages/Projects/Show.tsx`.

### 3.2 Login

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant AuthController
    participant Auth
    participant UserModel

    User->>Browser: Isi email dan password
    Browser->>AuthController: POST /login
    AuthController->>Auth: Auth::attempt(credentials)
    Auth-->>AuthController: Berhasil atau gagal
    alt credentials salah
        AuthController-->>Browser: Kembali dengan error email
    else akun tidak aktif
        AuthController->>Auth: Logout
        AuthController-->>Browser: Kembali dengan error akun nonaktif
    else berhasil
        AuthController->>Browser: Regenerate session
        AuthController-->>Browser: Redirect /dashboard
    end
```

Password di-hash melalui cast `hashed` pada `User`. Saat login berhasil, session diregenerasi untuk mengurangi risiko session fixation. Middleware Inertia membagikan user, role, permission, dan flash message ke frontend.

### 3.3 Registrasi user

1. User terautentikasi mengakses `POST /register`.
2. Route mensyaratkan role `super_admin` atau `Super Admin`.
3. `RegisterRequest` memvalidasi input.
4. `AuthController::register()` membuat user dan memakai role Spatie.
5. Role default adalah `member` jika field role tidak dikirim.

### 3.4 Siklus project

```mermaid
flowchart TD
    A[POST /projects] --> B[StoreProjectRequest]
    B --> C[Gate authorize create]
    C --> D[Project::create manager_id = user aktif]
    D --> E[Redirect projects.index]
    F[GET /projects] --> G{Super Admin?}
    G -->|Ya| H[Semua project + manager + members]
    G -->|Tidak| I[Project manager atau member saja]
    H --> J[Inertia Projects/Index]
    I --> J
    K[GET /projects/id] --> L[ProjectPolicy view]
    L --> M[Manager/member atau Super Admin]
    M --> N[Inertia Projects/Show]
    O[PUT/PATCH /projects/id] --> P[UpdateProjectRequest]
    P --> Q[ProjectPolicy update]
    Q --> R[Update project]
    S[DELETE /projects/id] --> T[ProjectPolicy delete]
    T --> U[Hanya Super Admin secara efektif]
```

Aturan akses project yang sudah diterapkan:

- Super Admin melewati policy melalui `ProjectPolicy::before()`.
- User biasa harus memiliki permission `projects.view` dan menjadi manager atau member project tertentu.
- Project Manager hanya dapat mengubah project yang `manager_id`-nya adalah dirinya.
- Hanya Super Admin yang dapat menghapus project melalui kombinasi policy dan permission.
- Query index menggunakan eager loading `manager` dan `members`, serta pagination 15 item.

## 4. Business Logic yang Sudah Berjalan

### Authentication dan account

- Login menggunakan email/password.
- Akun dengan `is_active = false` ditolak.
- Logout menghapus session dan meregenerasi CSRF token.
- Password memakai hashing otomatis dari model cast.
- Route terlindungi menggunakan middleware `auth` dan `verified`.
- Registrasi dibatasi oleh middleware role Spatie pada route `role:super_admin|Super Admin`.

### RBAC

Spatie mengelola role dan permission melalui tabel `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, dan `role_has_permissions`. Role yang diseed: `super_admin`, `project_manager`, `member`, dan `viewer`. Model role custom dan middleware role lokal sudah dihapus; Spatie menjadi satu-satunya sumber RBAC.

Permission yang sudah didefinisikan mencakup user, project, task, attachment, comment, dan audit log. Sebagian permission task/attachment/comment/audit log belum memiliki fitur pemakai di controller maupun route.

### Project

- Project memiliki status `planning`, `active`, `on_hold`, `completed`, atau `cancelled`.
- `end_date` harus sama atau setelah `start_date` pada create dan update.
- Manager diset dari user yang sedang login ketika create; input `manager_id` tidak diterima dari request.
- Relasi manager adalah one-to-many.
- Relasi members adalah many-to-many melalui `project_user`.
- Foreign key project ke user memakai `restrictOnDelete`; pivot memakai `cascadeOnDelete`.

### Authorization anti-IDOR

Policy memeriksa object project yang diminta, bukan hanya role global. Karena itu member Project A tidak dapat membuka Project B, meskipun keduanya memiliki role yang sama. Inilah kontrol utama terhadap akses langsung menggunakan ID project.

## 5. Business Logic yang Direncanakan tetapi Belum Terimplementasi

Berdasarkan `app_specification.md` dan `brief.md`, area berikut masih berupa target desain:

- Task dan subtask: model, migration, CRUD, assignee, priority, status workflow.
- Validasi dependency task sebelum status menjadi `done`.
- Kanban board dan fractional position untuk reorder task.
- Approval flow: submit review, approve, reject, dan revision required.
- Comment dan mention.
- Attachment private storage, validasi MIME/ukuran, download policy.
- Activity log dan observer untuk perubahan Project/Task.
- Notifications database dan deadline alert.
- Queue untuk email, mention, dan alert.
- Cache untuk KPI dashboard. Dashboard sudah menerima sebagian KPI dari database, tetapi belum menggunakan `Cache::remember()`.
- Admin UI untuk user, role, permission, dan audit log.
- REST API yang konsisten. Saat ini `routes/api.php` belum memiliki endpoint.

## 6. Status Fitur Saat Ini

| Fitur | Status | Bukti / catatan |
|---|---|---|
| Redirect root ke login | Selesai | `routes/web.php` |
| Halaman login Inertia | Selesai sebagian | `AuthController` dan `Pages/Auth/Login.tsx` tersedia |
| Login valid | Selesai | `AuthTest` mencakup seluruh role |
| Login gagal / akun nonaktif | Selesai | Diuji di `AuthTest` |
| Logout dan session invalidation | Selesai | `AuthController::logout()` |
| Registrasi user oleh Super Admin | Selesai backend | Route role-protected dan test tersedia; belum ada halaman admin |
| RBAC Spatie | Selesai backend | Seeder role/permission dan `User::HasRoles` |
| Share user, role, permission ke Inertia | Selesai | `HandleInertiaRequests` |
| Dashboard | Implementasi awal | Statistik user, total project, dan active project sudah dihitung dari database; KPI task masih bernilai `0` karena modul task belum ada; status sistem masih label `Online` |
| Create project | Selesai backend | Request, policy, controller, model, migration |
| List project | Backend tersedia, frontend belum lengkap | Controller merender `Projects/Index`, tetapi page tersebut belum ada di workspace |
| Detail project | Selesai minimal | Policy, controller, page `Projects/Show`; UI baru menampilkan nama |
| Update project | Selesai backend | Request, policy, controller; UI belum terlihat |
| Delete project | Selesai backend | Super Admin diuji; UI belum terlihat |
| Project membership management | Data relation saja | Pivot dan relation ada, route/controller mutasi belum ada |
| Anti-IDOR project | Selesai backend | `ProjectPolicy` dan `ProjectAuthorizationTest` |
| Task management | Belum dimulai | Tidak ada model/migration/controller/page task |
| Approval | Belum dimulai | Belum ada resource implementasi |
| Comment | Belum dimulai | Belum ada resource implementasi |
| Attachment | Belum dimulai | Belum ada resource/policy/route download |
| Audit log | Belum dimulai | Belum ada tabel/model/observer |
| Queue, notification, cache KPI | Belum dimulai | Belum ada implementasi fitur terkait |
| REST API | Belum dimulai | `routes/api.php` kosong secara fungsional |
| Automated tests | Fondasi tersedia | Test auth dan authorization project ada; cakupan fitur inti lainnya belum ada |

Secara keseluruhan, sistem saat ini berada pada tahap **MVP fondasi: authentication + RBAC + dashboard KPI dasar + project authorization/CRUD backend**, belum pada tahap fitur penuh Project Management System.

## 7. Temuan Teknis yang Perlu Diperhatikan

1. `ProjectController::index()` merender `Projects/Index`, tetapi file page tersebut belum tersedia. Akses `GET /projects` berpotensi gagal saat resolver Inertia mencari komponen itu.
2. Dashboard sudah memakai query database untuk `total_users`, `total_projects`, dan `active_projects`, tetapi route masih berupa closure dan belum dipindahkan ke controller/service khusus. `completed_tasks`, `pending_tasks`, dan `in_progress_tasks` masih `0` sebagai placeholder.
3. Dashboard belum menggunakan `Cache::remember()` meskipun spesifikasi mewajibkan cache untuk agregasi KPI.
4. Nama permission pada seeder kini sudah diselaraskan ke spesifikasi utama, termasuk `tasks.change_status`, `roles.manage`, dan `audit_logs.view`. Namun fitur yang menggunakan permission tersebut belum seluruhnya tersedia.
5. `composer.json` menetapkan PHP `^8.2`, sementara spesifikasi menargetkan PHP 8.3+. Constraint deployment dan dokumentasi perlu disepakati.

## 8. Urutan Pengembangan yang Disarankan

1. Lengkapi page `Projects/Index` dan UI CRUD project, lalu verifikasi build frontend.
2. Pindahkan logika statistik dashboard ke controller/service dan tambahkan `Cache::remember()` setelah modul task tersedia.
3. Implementasikan membership management dengan policy `manageMembers` dan test anti-IDOR.
4. Tambahkan resource Task beserta enum status/priority, assignee, Form Request, Policy, dan test.
5. Tambahkan dependency validation, approval workflow, dan Kanban reorder.
6. Tambahkan comment, attachment private storage, download authorization, dan notification.
7. Implementasikan activity log observer dan queue untuk pekerjaan asynchronous.
8. Tambahkan halaman frontend per role dan feature test untuk setiap aturan akses.
9. Bila REST API memang wajib, tentukan kontrak API lalu buat controller/resource di `routes/api.php`; jangan mencampur response JSON dan Inertia tanpa boundary yang jelas.

## 9. Validasi yang Tersedia

Perintah `php artisan test` terakhir berhasil dengan exit code `0` dan menghasilkan 15 test passed serta 86 assertions. Test yang ada memvalidasi login, akun nonaktif, profile access, pembatasan registrasi, dan authorization project termasuk skenario anti-IDOR. Belum ada test khusus untuk statistik dashboard atau page list project.

## 10. Pembaruan Status Implementasi (2026-08-28)

Bagian ini mencatat kondisi kode terbaru pada branch `feature/task`. Status ini menjadi rujukan ketika berbeda dengan target desain pada dokumen spesifikasi.

### 10.1 Struktur dan route yang tersedia

Aplikasi tetap berupa Laravel monolith dengan Inertia.js, React, TypeScript, dan session authentication. Backend kini memiliki `Task`, `Comment`, `Attachment`, `Approval`, `ActivityLog`, `TaskObserver`, `TaskPolicy`, dan `TaskService`. `routes/api.php` belum memiliki endpoint fungsional.

Route task dan kolaborasi yang tersedia:

```text
POST   /tasks
PATCH  /tasks/{task}/status
DELETE /tasks/{task}
POST   /tasks/{task}/comments
DELETE /comments/{comment}
POST   /tasks/{task}/attachments
GET    /attachments/{attachment}/download
```

Belum tersedia route task index/show/edit, mutasi membership project, atau approval.

### 10.2 Logika task yang sudah berjalan

- `StoreTaskRequest` memvalidasi project, parent task, title, priority, status, tanggal, assignee, label, dan dependency.
- Task baru ditempatkan pada `max(position) + 1000` untuk kolom statusnya.
- `TaskService::updateStatus()` menolak status `done` jika dependency belum selesai dan mengembalikan judul dependency yang belum selesai.
- `TaskService::updatePosition()` mendukung fractional Kanban position: `1000`, `next / 2`, `previous + 1000`, atau rata-rata dua posisi.
- `TaskPolicy` mengatur akses view, create, update, status change, dan delete; Super Admin memiliki policy bypass.
- `TaskObserver` mencatat `TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_CHANGED`, dan `TASK_DELETED` ke `activity_logs`.

### 10.3 Fitur parsial atau belum tersedia

- Model dan migration task, assignee, label, subtask, dependency, comment, attachment, approval, dan activity log sudah ada, tetapi UI task/Kanban belum tersedia.
- Approval baru memiliki schema/model; alur submit review, approve, reject, dan revision belum ada.
- Comment dan attachment masih memakai validasi inline; `AttachmentPolicy` dan `StoreAttachmentRequest` belum ada. Attachment memakai disk `local`, bukan disk private yang ditargetkan.
- Hanya `TaskObserver` yang terdaftar; `ProjectObserver` belum ada.
- Statistik task dashboard masih placeholder `0` dan agregasi KPI belum memakai cache.
- User management baru mendukung registrasi dan pemberian role oleh Super Admin; CRUD, status management, policy, dan UI admin belum ada.

### 10.4 Test dan urutan pengembangan

Test yang ada mencakup authentication, akun nonaktif, otorisasi registrasi, anti-IDOR project, otorisasi penghapusan project, dan aturan dependency task. Test terfokus untuk policy/endpoint task, posisi Kanban, keamanan comment/attachment, approval, observer, dashboard, dan user management masih diperlukan.

Urutan prioritas berikutnya adalah menyelesaikan UI task/Kanban dan project list, user management Super Admin, Form Request dan AttachmentPolicy, approval dan ProjectObserver, test endpoint/otorisasi, agregasi dashboard dengan `Cache::remember()`, lalu queue dan notifikasi.