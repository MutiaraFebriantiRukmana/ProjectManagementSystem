# Database Migrations & Seeders

Dokumen ini menjelaskan struktur migrasi basis data dan strategi _seeding_ yang diterapkan pada aplikasi **Project Management System**.

## 1. Migrations
Desain tabel mematuhi aturan normalisasi yang baik dengan mempertimbangkan _data integrity_ dan performa. Kunci asing (*foreign keys*) digunakan secara ekstensif dengan opsi `cascadeOnDelete` atau `restrictOnDelete` sesuai konteks.

### Indeks (Indexing) Terapan
Agar performa sistem tinggi, kami menerapkan *indexing* pada kolom-kolom yang sering dikueri, meliputi:
- `status`, `manager_id` di tabel `projects`.
- `status`, `priority`, `project_id`, `position` di tabel `tasks`.
- Indeks komposit `entity_type` dan `entity_id` di tabel `activity_logs`.

### Daftar Tabel Utama
- `users`: Data pengguna (username, email, password).
- `projects`: Induk proyek, dikepalai oleh seorang `manager_id`.
- `tasks`: Detail pekerjaan, terkait ke `project_id`, dapat berupa *subtask* (melalui `parent_id`).
- `labels`, `comments`, `task_attachments`: Tabel-tabel terkait informasi spesifik *Task*.
- `approvals`: Menyimpan persetujuan untuk Task tertentu.
- `activity_logs`: Jejak audit setiap perubahan data kritis.
- **Tabel Pivot**: `project_user`, `task_user`, `label_task`, `task_dependencies`.

## 2. Seeders
_Database Seeder_ berfungsi untuk mengisi data dummy awal (admin utama, struktur RBAC, dll) guna mempermudah *development* dan *testing*. 

### Role and Permission Seeder
Pengaturan Role dan Permission diinisialisasi melalui `RoleAndPermissionSeeder`. Struktur permission yang digunakan mengikuti skema ketat:

**Tingkat Hak Akses yang Di-seed:**
1. **Super Admin**: Otomatis mendapatkan semua hak akses yang tersedia melalui `Gate::before`. (Hak pengelolaan users, roles, dan audit_logs HANYA eksklusif milik peran ini secara _hardcode_ untuk keamanan).
2. **Project Manager**: 
   - Projects: `projects.view`, `projects.create`, `projects.update`, `projects.manage_members`
   - Tasks: `tasks.view`, `tasks.create`, `tasks.update`, `tasks.delete`, `tasks.change_status`, `tasks.assign`, `tasks.approve`
   - Lainnya: Mengomentari dan mengelola berkas.
3. **Member**: 
   - Akses sangat terbatas. Hanya `projects.view`, `tasks.view`, `tasks.change_status`, `tasks.submit_review`, serta hak komentar/berkas.
4. **Viewer / Client**:
   - `projects.view`, `tasks.view`, `attachments.download`.

### Eksekusi Seeder
Untuk membersihkan dan menginisialisasi ulang *database* beserta semua seeder (User, Role, Project, dsb):
```bash
php artisan migrate:fresh --seed
```
