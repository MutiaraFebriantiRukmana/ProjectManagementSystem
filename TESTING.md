# Automated Testing

Aplikasi ini mengimplementasikan pengujian (*automated tests*) untuk menjaga kualitas perangkat lunak (*code quality*) dan memastikan tidak adanya fitur yang rusak ketika aplikasi dikembangkan. Pengujian diletakkan pada folder `tests/Feature` dan `tests/Unit`.

## Fokus Pengujian
Setidaknya hal-hal berikut dicakup oleh *test suite*:

### 1. Authentication & Security
- Menguji bahwa *User* dengan kredensial yang tepat dapat berhasil masuk (Login).
- Menguji bahwa *User* yang tidak melakukan autentikasi (belum login) ditolak (Akses dialihkan / 401) jika mencoba mengakses rute internal yang diproteksi.

### 2. Authorization (Anti-IDOR)
- Menguji bahwa *User* tidak dapat mengakses proyek milik *User* lain atau yang tidak dia ikuti.
- Memastikan bahwa *Role* `Member` tidak bisa menghapus proyek (harus mendapat `403 Forbidden`).
- Memastikan bahwa `Viewer` tidak bisa menggeser/mengubah *Task*.

### 3. Business Logic
- **Task Dependency:** Memastikan sistem melempar kegagalan (tidak mengizinkan) ketika sebuah *Task* dicentang `Done`, namun *Subtask* atau *Task* prasyarat (*depends_on_task_id*) masih dalam status `In Progress`.
- **Approval Workflow:** Memastikan bahwa *Task* tidak dapat dilanjutkan statusnya jika *approval* ditolak oleh Project Manager.
- **Kanban Ordering:** Memastikan posisi *Task* diubah secara matematis dengan benar dan tidak mengalami bentrok duplikasi.

### 4. Validation
- Sistem berhasil memblokir input tanpa judul (Title wajib).
- Status kustom yang tidak ada (selain backlog, todo, in_progress, review, done) divalidasi.
- Menolak unggahan _file_ terlarang (Misal mengunggah berkas `.exe` sebagai *attachment* dilarang).

## Cara Menjalankan Pengujian

Menjalankan keseluruhan *test*:
```bash
php artisan test
```

Menjalankan test file tertentu:
```bash
php artisan test tests/Feature/TaskDependencyTest.php
```
