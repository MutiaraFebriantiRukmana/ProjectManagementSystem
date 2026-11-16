# Enterprise Project Management System

## Latar Belakang
Sebuah aplikasi web berbasis Laravel dan React (Inertia.js) untuk membantu perusahaan mengelola proyek, anggota tim, *task*, alur kerja (*workflow*), proses persetujuan (*approval*), dan pemantauan kemajuan (*progress*) secara terpusat. Sistem ini dibangun dengan fokus pada arsitektur aplikasi yang scalable, *business logic* di backend, keamanan, performa, dan kemudahan pemeliharaan (*maintainability*).

## Deployment URL
- **Production / Staging:** *(Belum tersedia - silakan sesuaikan saat aplikasi di-*deploy*)*
- **Local Development:** `http://localhost:8000`

## Tech Stack Utama
- **Backend:** Laravel 12 (PHP 8.3+)
- **Frontend:** React, Inertia.js, TypeScript, Tailwind CSS
- **Database:** MySQL 8.0+ (Menggunakan Eloquent ORM)
- **Tools Tambahan:** Vite, Redis (opsional untuk caching & queue), Git

## Dokumentasi Teknis
Untuk detail setiap bagian sistem, silakan baca dokumentasi terpisah berikut:
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Panduan arsitektur sistem, aturan penulisan kode, dan tech stack detail.
2. [DATABASE.md](./DATABASE.md) - Dokumentasi skema database, migration, dan seeder (Role & Permission).
3. [ERD.md](./ERD.md) - Diagram relasi entitas (Entity Relationship Diagram).
4. [FEATURES.md](./FEATURES.md) - Penjelasan mendetail tentang fitur-fitur yang tersedia di aplikasi.
5. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Standar REST API yang digunakan (struktur respons JSON, HTTP Status, dll).
6. [TESTING.md](./TESTING.md) - Dokumentasi terkait skenario *automated testing*.
7. [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) - Daftar *bug* atau batasan sistem yang saat ini diketahui.

## Cara Instalasi (Local Development)

1. Clone repositori ini.
   ```bash
   git clone <repo-url>
   cd project-management-system
   ```
2. Salin file environment dan atur koneksi database.
   ```bash
   cp .env.example .env
   ```
3. Install dependensi backend (Composer) dan frontend (NPM).
   ```bash
   composer install
   npm install
   ```
4. *Generate* application key.
   ```bash
   php artisan key:generate
   ```
5. Jalankan migrasi dan seeder.
   ```bash
   php artisan migrate --seed
   ```
6. Jalankan queue worker (diperlukan untuk *background jobs* seperti notifikasi).
   ```bash
   php artisan queue:work
   ```
7. Jalankan *local development server*.
   ```bash
   # Di terminal 1:
   php artisan serve
   
   # Di terminal 2:
   npm run dev
   ```
