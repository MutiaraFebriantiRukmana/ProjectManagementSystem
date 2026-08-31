# Dokumentasi Fitur

Aplikasi **Project Management System** ini menyediakan rangkaian fitur ekstensif yang disesuaikan untuk manajemen perusahaan.

## 1. Authentication & Role-Based Access Control
- **Login, Logout, & Session Management.**
- **4 Role Utama:** Super Admin, Project Manager, Member, dan Viewer/Client.
- **Role Permissions:** Hak akses diregulasi sangat ketat di level kueri basis data. Super Admin menguasai pengelolaan sistem; *Project Manager* dibatasi hanya pada proyek yang mereka kepalai; *Member* hanya dapat melihat dan mengerjakan *Task* proyek yang terhubung pada mereka.

## 2. Project Management
Manajemen menyeluruh dari awal hingga akhir (*end-to-end*) setiap inisiatif proyek.
- **Informasi Proyek:** Nama, deskripsi, status (Planning, Active, On Hold, Completed, Cancelled), rentang waktu (Mulai dan Tenggat).
- **Membership:** Penunjukan *Project Manager* dan penambahan atau pencabutan *Member* ke dalam proyek.

## 3. Task Management & Dependencies
Bukan sekadar operasi CRUD biasa, pembuatan *Task* dilengkapi fitur kompleks:
- Menambahkan **Assignee** (pelaksana) dan **Reporter** (pelapor).
- Mengatur **Priority** (Low, Medium, High, Critical).
- **File Attachments:** Kemampuan mengunggah lampiran aman yang tervalidasi ukurannya, disimpan dengan *hash filepath* dan dibatasi pengunduhannya.
- **Task Dependencies:** Sebuah *Task* tidak bisa selesai jika *Task* yang menjadi prasyaratnya (yang di-depend) belum tuntas (validasi di backend).

## 4. Kanban Board
Antarmuka visual dan interaktif.
- **Status:** Backlog ➜ Todo ➜ In Progress ➜ Review ➜ Done.
- Mampu **Drag and Drop** *Task* antar kolom.
- Logika re-ordering yang andal (menghitung koordinat posisi _floating_ untuk mencegah duplikasi order).

## 5. Approval Workflow
Proses verifikasi tugas khusus.
- Anggota tim dapat mengirim status tugas menjadi *Review*.
- *Project Manager* dapat memilih untuk menyetujui (Approve), menolak (Reject), atau meminta revisi (Request Revision).
- Histori setiap status persetujuan disimpan dengan baik.

## 6. Comments, Discussion & Mentions
Diskusi tim pada setiap *Task*.
- Tim bisa menulis komentar, mengedit, atau menghapusnya (jika miliknya).
- Fitur **Mention** (`@username`) untuk memanggil anggota lain ke dalam sebuah *Task*.

## 7. Notifications
Pemberitahuan otomatis asinkronus (*Queue*).
- Dikeluarkan untuk kondisi tertentu: tugas baru, *deadline* menipis, komentar masuk, *mention*, maupun hasil akhir dari sebuah proses *approval*.

## 8. Audit Logs (Activity Trail)
Pemantauan intensif semua aktivitas sistem.
- Merekam setiap perubahan: Siapa (User), Kapan (Timestamp), Tindakan (Action), dan Apa yang diubah (Old Value ke New Value).
- Log hanya bisa dilihat secara statis oleh **Super Admin** (hak akses disembunyikan dari UI pengaturan *permission* dinamis guna mencegah *privilege escalation*).

## 9. Dashboard Dinamis
Tampilan wawasan aplikasi berdasarkan otoritas (*Role*).
- Super Admin: Statistik infrastruktur seluruh aplikasi (Total Users, Active Projects dll).
- Project Manager: *Workload* tim, dan persentase *Task Pending*.
- Member: Mengukur tugas pribadi yang telah dan sedang berlangsung.

## 10. Search, Filter, & Pagination
Pencarian skala besar tanpa membebani _server_:
- Filter dan sortir berbasis server (bukan di frontend).
- Parameter filter mendukung kueri URL (`?status=in_progress&priority=high`).
