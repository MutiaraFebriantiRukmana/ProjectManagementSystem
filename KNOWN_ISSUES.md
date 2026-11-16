# Known Issues

Berikut adalah daftar batasan (*limitations*) dan masalah yang diketahui (*known issues*) dalam sistem hingga saat ini.

### 1. Manajemen Hak Akses Admin Tersembunyi (UI)
- Hak akses untuk `users.view`, `roles.manage`, dan `audit_logs.view` telah **dihapus** dari matriks pengaturan di antarmuka "Kelola Hak Akses". Hal ini karena fitur-fitur tersebut di-*hardcode* khusus untuk pengguna bertitel `Super Admin`. Upaya menyalakan *checkbox* tersebut di UI sebelumnya tidak berdampak apapun pada peran selain Super Admin, sehingga untuk menghindari kebingungan UI, fitur tersebut sengaja disembunyikan.

### 2. Notifikasi Email (Queue)
- Notifikasi *real-time* dengan WebSocket atau Laravel Reverb belum aktif sebagai opsi utama pada lingkungan pengembangan secara otomatis; sistem saat ini lebih berfokus pada notifikasi *database* standar dan asinkron melalui tabel *database queues*. 

### 3. Upload File Skala Besar
- Pada *attachment* tugas, aplikasi masih memproses berkas secara utuh di memori saat mengunggah. Untuk versi operasional produksi besar, pertimbangkan penerapan metode *Chunk Uploading* apabila besaran *file* mencapai di atas batas `upload_max_filesize` milik *php.ini* (seringkali standar mentok pada 2MB - 10MB).

### 4. Responsiveness UI 
- Tabel matriks manajemen *role* dan beberapa tabel audit log yang memuat teks JSON (`old_value`, `new_value`) akan sedikit padat bila dilihat pada resolusi perangkat layar sempit (seperti di _mobile browser_). Tampilan optimal saat ini disarankan menggunakan *desktop viewport*.
