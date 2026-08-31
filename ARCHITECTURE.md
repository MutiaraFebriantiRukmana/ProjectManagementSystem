# Architecture Documentation

Dokumen ini menjelaskan arsitektur perangkat lunak yang digunakan dalam **Enterprise Project Management System**.

## 1. Pola Arsitektur Utama (Monolith dengan Inertia.js)
Aplikasi ini dikembangkan menggunakan arsitektur **Monolith Modern** melalui integrasi **Laravel + Inertia.js + React**.
- **Backend (Laravel):** Menangani *routing*, autentikasi, *business logic*, otorisasi, validasi data, dan interaksi ke *database*.
- **Frontend (React + Tailwind CSS):** Menangani antarmuka pengguna interaktif (seperti *Kanban Board* dengan *drag-and-drop*).
- **Inertia.js:** Menghubungkan Backend dan Frontend tanpa perlu membangun REST API secara terpisah untuk setiap halaman, memungkinkan pengembangan cepat dengan nuansa *Single Page Application (SPA)*.

## 2. Standar Penulisan Kode (STRICT)

### Form Request Validation
- **Aturan:** JANGAN PERNAH menulis `$request->validate()` di dalam *Controller*.
- **Praktik:** Semua validasi masukan (`create`, `update`) wajib menggunakan kelas `FormRequest` tersendiri (contoh: `StoreTaskRequest`, `UpdateProjectRequest`). Ini memisahkan *logic* validasi dari *business logic*.

### Authorization (Kebijakan Akses)
- **Aturan:** JANGAN HANYA menyembunyikan tombol di *frontend*.
- **Praktik:** Setiap tindakan membaca (*read*), mengubah (*update*), dan menghancurkan (*delete*) wajib divalidasi melalui kelas `Policy` Laravel (e.g., `ProjectPolicy`, `TaskPolicy`). Akses yang tidak sah harus menghasilkan kode `403 Forbidden`.

### Kinerja (Performance) dan Kueri Database
- **Zero N+1 Query:** Gunakan fitur Eager Loading (`with()`) secara ketat pada kueri basis data untuk list data.
- **Pagination:** Semua data agregat (*list endpoints*) harus di-*paginate* menggunakan metode `->paginate(15)` bawaan Laravel untuk menghindari beban memori.
- **Caching:** Aggregasi data kueri berat, seperti pada perhitungan metrik di Dashboard (Total Project, Task Overdue), wajib menggunakan implementasi `Cache::remember()`.

### Asynchronous & Background Jobs (Queue)
Proses yang memakan waktu lama wajib didelegasikan ke dalam *Background Job* (Queue) agar tidak memblokir respon HTTP pengguna.
- Pengiriman Notifikasi (Email / Database).
- Pemrosesan *file* berukuran besar.
- Pemeriksaan tenggat waktu (*deadline reminder*).

## 3. Penanganan Autorisasi Khusus (RBAC)
Sistem menggunakan `spatie/laravel-permission` untuk *Role-Based Access Control*.
- **Super Admin Bypass:** Super Admin tidak perlu diberikan setiap *permission* secara eksplisit satu per satu di logika kode; digunakan fitur intersep `Gate::before()` untuk mengizinkan akses ke semua aksi secara global, atau men-*sync* seluruh permissions di Database.
- **Otorisasi Berbasis Proyek (Anti-IDOR):** Di luar *global permissions*, otorisasi juga dilakukan di tingkat sumber daya (*resource-level*). Seorang pengguna tidak boleh mengakses Task jika dia bukan anggota Project dari Task tersebut.

## 4. Pola Pengembangan Kode
Tim diharapkan untuk:
- Menggunakan **Service Layer** atau **Action Classes** jika *logic* kontroler menjadi terlalu berat.
- Mengimplementasikan **Model Observers** untuk mencatat jejak audit (*Audit Trail* / `activity_logs`) secara terotomatisasi ketika Model mengalami operasi `created`, `updated`, atau `deleted`.
