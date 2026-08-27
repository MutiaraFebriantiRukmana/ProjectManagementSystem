# Panduan Sistem Autentikasi dan Otorisasi (RBAC)

Dokumen ini menjelaskan seluruh komponen autentikasi dan otorisasi berbasis role (Role-Based Access Control / RBAC) yang telah diimplementasikan dalam sistem manajemen project ini.

Sistem ini menggunakan arsitektur **Decoupled (Terpisah)**:
- **Backend**: Laravel REST API (berjalan di port `8000`)
- **Frontend**: Next.js dengan TypeScript & Tailwind CSS (berjalan di port `3000`)

---

## 1. Apa Saja yang Sudah Tersedia?

Sistem telah memiliki fondasi autentikasi stateful (cookie-based) SPA menggunakan Laravel Sanctum yang terintegrasi secara dinamis dengan frontend Next.js:

1. **Struktur Database (MySQL)**
   - **Tabel `roles`**: Menyimpan data role (`role_id`, `role_name`, `display_name`, `description`, `created_at`).
   - **Tabel `users`**: Menyimpan data user (`user_id`, `username`, `email`, `password`, `role_id`, `is_active`, `remember_token`, `created_at`, `updated_at`).
   - Hubungan foreign key yang aman antara `users.role_id` ke `roles.role_id` (`onDelete('restrict')`).
   
2. **Model & Relationship (Eloquent)**
   - [`User.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/app/Models/User.php): Model user yang terintegrasi dengan trait `HasApiTokens` (Sanctum), mass-assignment protection (`$fillable`), password auto-hashing (`casts`), dan relasi `belongsTo` ke `Role`.
   - [`Role.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/app/Models/Role.php): Model role dengan konstanta role (`SUPER_ADMIN`, `PROJECT_MANAGER`, `MEMBER`, `CLIENT`), daftar validasi `ALL_ROLES`, dan relasi `hasMany` ke `User`.

3. **Controller & Validation Request**
   - [`AuthController.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/app/Http/Controllers/Auth/AuthController.php): Menangani business logic login (dengan session fixation protection via `session()->regenerate()`), registrasi user baru (khusus Super Admin), logout, dan pengambilan data profile (`/me`).
   - [`LoginRequest.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/app/Http/Requests/Auth/LoginRequest.php) & [`RegisterRequest.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/app/Http/Requests/Auth/RegisterRequest.php): Form Request Validation untuk memisahkan logic validasi input dari Controller, lengkap dengan pesan error kustom bahasa Indonesia.

4. **Middleware Otorisasi Backend**
   - [`RoleMiddleware.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/app/Http/Middleware/RoleMiddleware.php): Memvalidasi akses endpoint berdasarkan role secara backend. Jika user tidak memiliki role yang diizinkan, system menolak request dengan response `403 Forbidden`.

5. **API Routing & CORS**
   - [`api.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/routes/api.php): Mendaftarkan rute publik `/api/login` dan rute terproteksi `/api/me`, `/api/logout` (semua role), serta `/api/register` (khusus role `super_admin`).
   - [`cors.php`](file:///d:/SEMESTER 7/magang/ProjectManagementSystem/project-management-system/config/cors.php): Mengizinkan domain frontend (localhost:3000) untuk berkomunikasi secara cross-origin dan mengirimkan session credentials.

6. **Database Seeder & Dummy Users**
   - Telah ditambahkan data dummy user untuk masing-masing role dengan password default: `password123`.

---

## 2. Data Dummy User (Tersedia di Database)

Semua user di bawah ini telah terdaftar di database `db_management` melalui `DatabaseSeeder`:

| Role | Username | Email | Password | Hak Akses & Tampilan Dashboard |
|---|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin@pm.test` | `password123` | Akses penuh sistem, kelola user/role/permission, registrasi user baru. |
| **Project Manager** | `projectmanager` | `pm@pm.test` | `password123` | Membuat project, memantau anggota tim, mengelola task & approval. |
| **Member** | `member` | `member@pm.test` | `password123` | Melihat project diikuti, update status pengerjaan task, memberi komentar. |
| **Client** | `client` | `client@pm.test` | `password123` | Memantau perkembangan milestone project secara transparan (read-only). |

---

## 3. Komponen Frontend (Next.js App)

Frontend dibangun di dalam folder `frontend/` menggunakan Next.js (App Router), TypeScript, dan Tailwind CSS:

1. **Authentication Context (`auth-context.tsx`)**:
   Menyediakan global state management untuk mengecek status autentikasi user saat ini, login, logout, dan memicu redirect otomatis.
2. **API Client (`api.ts`)**:
   Instance Axios yang terkonfigurasi dengan `withCredentials: true` untuk Sanctum SPA flow dan penanganan CSRF cookie.
3. **Login Page (`login/page.tsx`)**:
   Halaman login premium dengan validasi form, loading states, dan error handling real-time dari API.
4. **Dashboard Layout (`dashboard/layout.tsx`)**:
   Shared layout dinamis yang menyediakan sidebar navigasi yang berubah sesuai role, avatar profil, dan tombol **Keluar (Logout)** di header kanan atas serta bagian bawah sidebar.
5. **Dynamic Dashboard (`dashboard/page.tsx`)**:
   Halaman dashboard tunggal yang merender data secara dinamis berdasarkan role user yang aktif (Super Admin, PM, Member, Client).

---

## 4. Cara Menjalankan Aplikasi

Pastikan database MySQL Anda sudah menyala dan dikonfigurasi pada file `.env` Laravel backend.

### A. Jalankan Backend (Laravel API)
Masuk ke direktori utama, kemudian jalankan server:
```bash
php artisan serve
```
*Backend berjalan di: **`http://localhost:8000`***

### B. Jalankan Frontend (Next.js)
Buka terminal baru, arahkan ke folder `frontend`, dan nyalakan development server:
```bash
cd frontend
npm run dev
```
*Frontend berjalan di: **`http://localhost:3000`***

Akses halaman utama di browser melalui URL **`http://localhost:3000`** untuk menguji sistem login dan dashboard dinamis.
