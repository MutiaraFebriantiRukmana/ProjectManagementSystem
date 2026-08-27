# Panduan Sistem Autentikasi dan Otorisasi (RBAC)

Dokumen ini menjelaskan seluruh komponen autentikasi dan otorisasi berbasis role (Role-Based Access Control / RBAC) yang telah diimplementasikan dalam Laravel project ini.

---

## 1. Apa Saja yang Sudah Tersedia?

Sistem telah memiliki fondasi autentikasi yang lengkap dan siap digunakan untuk **Opsi A (Inertia + React)** maupun pengujian REST API:

1. **Struktur Database (MySQL)**
   - **Tabel `roles`**: Menyimpan data role (`role_id`, `role_name`, `display_name`, `description`, `created_at`).
   - **Tabel `users`**: Menyimpan data user (`user_id`, `username`, `email`, `password`, `role_id`, `is_active`, `remember_token`, `created_at`, `updated_at`).
   - Hubungan foreign key yang aman antara `users.role_id` ke `roles.role_id` (`onDelete('restrict')`).
   
2. **Model & Relationship (Eloquent)**
   - [`User.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Models/User.php): Model user yang terintegrasi dengan trait `HasApiTokens` (Sanctum), mass-assignment protection (`$fillable`), password auto-hashing (`casts`), dan relasi `belongsTo` ke `Role`.
   - [`Role.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Models/Role.php): Model role dengan konstanta role (`SUPER_ADMIN`, `PROJECT_MANAGER`, `MEMBER`, `VIEWER`), daftar validasi `ALL_ROLES`, dan relasi `hasMany` ke `User`.

3. **Controller & Validation Request**
   - [`AuthController.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Http/Controllers/Auth/AuthController.php): Menangani business logic login (dengan session fixation protection via `session()->regenerate()`), registrasi user baru (khusus Super Admin), logout, dan pengambilan data profile (`/me`).
   - [`LoginRequest.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Http/Requests/Auth/LoginRequest.php) & [`RegisterRequest.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Http/Requests/Auth/RegisterRequest.php): Form Request Validation untuk memisahkan logic validasi input dari Controller, lengkap dengan pesan error kustom bahasa Indonesia.

4. **Middleware Otorisasi Backend**
   - [`RoleMiddleware.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Http/Middleware/RoleMiddleware.php): Memvalidasi akses endpoint berdasarkan role secara backend. Jika user tidak memiliki role yang diizinkan, system menolak request dengan response `403 Forbidden`.

5. **API Routing**
   - [`api.php`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/routes/api.php): Mendaftarkan rute publik `/api/login` dan rute terproteksi `/api/me`, `/api/logout` (semua role), serta `/api/register` (khusus role `super_admin`).

6. **Database Seeder & Dummy Users**
   - Telah ditambahkan data dummy user untuk masing-masing role dengan password default: `password123`.

---

## 2. Data Dummy User (Tersedia di Database)

Semua user di bawah ini telah terdaftar di database `db_management` melalui `DatabaseSeeder`:

| Role | Username | Email | Password | Hak Akses |
|---|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin@pm.test` | `password123` | Akses penuh, mengelola user/role/permission, registrasi user baru. |
| **Project Manager** | `projectmanager` | `pm@pm.test` | `password123` | Membuat project, mengelola task & anggota. |
| **Member** | `member` | `member@pm.test` | `password123` | Melihat project diikuti, mengubah status task, memberi komentar. |
| **Viewer** | `viewer` | `viewer@pm.test` | `password123` | Hanya membaca progress project/task tertentu, dilarang edit. |

---

## 3. Cara Menguji Login (Verifikasi Role)

Pengujian dapat dilakukan dengan mudah menggunakan **Postman**, **Bruno**, atau **PowerShell/cURL**.

### A. Alur Sanctum Stateful (Session / Cookies) - Sesuai Opsi A (Inertia)
Sebelum mengirim request API, client (seperti browser atau Postman) harus mendapatkan session cookie dari Laravel.

1. **Dapatkan CSRF Cookie**
   - **Method**: `GET`
   - **URL**: `http://localhost:8000/sanctum/csrf-cookie`
   - **Fungsi**: Laravel akan mengirimkan cookie `XSRF-TOKEN` ke client.

2. **Kirim Login Request**
   - **Method**: `POST`
   - **URL**: `http://localhost:8000/api/login`
   - **Headers**:
     - `Accept: application/json`
     - `Content-Type: application/json`
   - **Body (JSON)**:
     ```json
     {
       "email": "superadmin@pm.test",
       "password": "password123"
     }
     ```
   - **Response Sukses (200 OK)**:
     ```json
     {
       "success": true,
       "message": "Login berhasil.",
       "data": {
         "user": {
           "user_id": 1,
           "username": "superadmin",
           "email": "superadmin@pm.test",
           "role": {
             "role_id": 1,
             "role_name": "super_admin",
             "display_name": "Super Admin"
           },
           "is_active": true,
           "created_at": "..."
         }
       }
     }
     ```

3. **Cek Identitas User Login (`/me`)**
   - **Method**: `GET`
   - **URL**: `http://localhost:8000/api/me`
   - **Headers**:
     - `Accept: application/json`
   - **Fungsi**: Memverifikasi bahwa session cookie bekerja dan server mengenali user beserta role-nya dengan benar.

4. **Uji Otorisasi Middleware (Contoh: Rute Khusus Super Admin)**
   - Coba akses rute register baru dengan **Super Admin**:
     - **Method**: `POST`
     - **URL**: `http://localhost:8000/api/register`
     - **Body**:
       ```json
       {
         "username": "newuser",
         "email": "newuser@pm.test",
         "password": "password123",
         "password_confirmation": "password123",
         "role_id": 3
       }
       ```
     - **Hasil**: Sukses `201 Created`.
   - Coba akses rute register baru setelah login sebagai **Project Manager** (`pm@pm.test`):
     - **Hasil**: Ditolak dengan `403 Forbidden` (`Anda tidak memiliki akses untuk tindakan ini`).

---

### B. Pengujian Otomatis via Script PowerShell
Anda dapat memverifikasi semua role langsung dari terminal PowerShell dengan menjalankan perintah berikut:

```powershell
$users = @(
    @{email="superadmin@pm.test"; password="password123"; role="super_admin"},
    @{email="pm@pm.test"; password="password123"; role="project_manager"},
    @{email="member@pm.test"; password="password123"; role="member"},
    @{email="viewer@pm.test"; password="password123"; role="viewer"}
);
foreach ($u in $users) {
    $body = @{ email = $u.email; password = $u.password } | ConvertTo-Json;
    $sessVar = "session_" + $u.role;
    try {
        # 1. Dapatkan CSRF cookie
        $null = Invoke-RestMethod -Uri "http://localhost:8000/sanctum/csrf-cookie" -Method GET -SessionVariable $sessVar -Headers @{ "Origin"="http://localhost"; "Referer"="http://localhost/" };
        $sessionObj = Get-Variable -Name $sessVar -ValueOnly;
        
        # 2. Login
        $loginRes = Invoke-RestMethod -Uri "http://localhost:8000/api/login" -Method POST -ContentType "application/json" -Body $body -Headers @{ "Accept"="application/json"; "Origin"="http://localhost"; "Referer"="http://localhost/" } -WebSession $sessionObj;
        
        # 3. Akses Profile /me
        $meRes = Invoke-RestMethod -Uri "http://localhost:8000/api/me" -Method GET -Headers @{ "Accept"="application/json"; "Origin"="http://localhost"; "Referer"="http://localhost/" } -WebSession $sessionObj;
        
        Write-Host "Verifikasi Sukses! User: $($u.email) -> Terdeteksi sebagai Role: $($meRes.data.user.role.display_name)" -ForegroundColor Green;
    } catch {
        Write-Error "Gagal memverifikasi user $($u.email): $_";
    }
}
```

---

## 4. Penjelasan Teknis & Alur Kerja (Apa Maksudnya?)

1. **Kenapa tabel `roles` dan `users` dipisah?**
   - Sesuai prinsip normalisasi database (1NF, 2NF, 3NF), role dipisah ke tabel master agar deskripsi dan nama role bersifat konsisten, tidak redundan di tabel users, serta memudahkan perluasan role baru (scalable) di masa depan tanpa mengubah struktur kolom tabel users.
   
2. **Di mana otorisasi dilakukan?**
   - Otorisasi sepenuhnya dikontrol di **Backend** menggunakan [`RoleMiddleware`](file:///d:/SEMESTER%207/magang/ProjectManagementSystem/project-management-system/app/Http/Middleware/RoleMiddleware.php). Jika client mencoba mengirim request manipulatif langsung ke endpoint API tanpa hak akses role yang sesuai, backend akan menolaknya. Ini memenuhi kriteria keamanan di brief (tidak hanya menyembunyikan tombol di frontend).

3. **Bagaimana session fixation & token hijacking dicegah?**
   - Saat login berhasil, backend memanggil `$request->session()->regenerate()` untuk membuat session ID baru, yang menghentikan serangan Session Fixation.
   - Form Request Validation memvalidasi semua parameter input sebelum masuk ke controller untuk mencegah injeksi data kotor (data integrity).
