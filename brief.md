# Brief Tugas — Project Management System 

## 1. Latar Belakang 

Perusahaan membutuhkan sebuah aplikasi internal untuk membantu pengelolaan project, anggota tim, task, workflow, approval, dan monitoring progress secara terpusat. 

Tim Anda ditugaskan untuk merancang dan membangun **Project Management System** berbasis web. Fokus utama proyek ini bukan hanya menyelesaikan fitur CRUD, tetapi juga menerapkan **arsitektur aplikasi yang baik, business logic, keamanan, performa, maintainability, dan kualitas kode** . 

Aplikasi harus dirancang seolah-olah akan digunakan dalam lingkungan perusahaan dengan banyak user dan project. 

# 2. Tujuan 

Melalui proyek ini, peserta diharapkan mampu: 

- Membangun aplikasi web fullstack menggunakan Laravel. 

- Merancang database yang scalable dan terstruktur. 

- Menerapkan authentication dan authorization. 

- Mengimplementasikan Role-Based Access Control. 

- Membuat business logic yang tidak hanya bergantung pada frontend. 

- Menangani relasi data yang kompleks. 

- Membuat REST API yang konsisten. 

- Menerapkan validasi dan security pada backend. 

- Mengoptimalkan query database. 

- Menulis kode yang maintainable dan mudah dikembangkan. 

- Membuat dokumentasi teknis. 

# 3. Tech Stack 

## Backend 

Wajib menggunakan: 

- Laravel 12 

- PHP 8.3+ 

- MySQL 

- Laravel Eloquent ORM 

- Laravel Form Request Validation 

- Laravel Policy / Gate 

- Laravel Queue 

- Laravel Cache 

- Laravel Notifications 

Frontend 

Bebas memilih salah satu: 

Opsi A — Inertia 

- Laravel 

- Inertia.js 

- React 

- TypeScript 

- Tailwind CSS 

Opsi B — API Architecture 

- Laravel sebagai REST API 

- React / Next.js sebagai frontend 

- TypeScript 

- Tailwind CSS 

Pemilihan arsitektur harus dijelaskan pada dokumentasi proyek. 

## Tools 

Direkomendasikan: 

- Git 

- GitHub / GitLab 

- Postman / Bruno 

- Docker atau Laravel Sail 

- Redis 

- Vite 

# 4. Role User 

Aplikasi minimal memiliki role berikut: 

## Super Admin 

Memiliki akses penuh terhadap sistem. 

Hak akses: 

- Mengelola user. 

- Mengelola role. 

- Mengelola permission. 

- Mengakses seluruh project. 

- Mengakses audit log. 

## Project Manager 

Bertanggung jawab terhadap project tertentu. 

Hak akses: 

- Membuat project. 

- Mengelola anggota project. 

- Membuat dan mengelola task. 

- Mengatur deadline. 

- Melakukan approval. 

- Melihat progress project. 

##### Project Manager **tidak boleh otomatis memiliki akses terhadap seluruh project** . 

## Member 

Hak akses: 

- Melihat project yang diikuti. 

- Melihat task yang diberikan. 

- Mengubah status task sesuai permission. 

- Membuat komentar. 

- Mengunggah attachment. 

- Mengirim task untuk review. 

Member tidak boleh: 

- Mengakses project lain. 

- Mengubah permission user. 

- Menghapus project. 

Viewer / Client 

Hak akses terbatas: 

- Melihat progress project tertentu. 

- Melihat task tertentu. 

- Melihat activity tertentu. 

Tidak dapat: 

- Mengubah task. 

- Menghapus data. 

- Mengatur anggota project. 

# 5. Authentication & Authorization 

Implementasikan: 

- Login. 

- Logout. 

- Session management. 

- Password hashing. 

- Authorization. 

- Role-Based Access Control. 

- Permission-based authorization. 

##### Authorization **wajib dilakukan di backend** . 

Contoh skenario: 

User A adalah member pada Project A. 

User A mencoba membuka: 

/projects/999 

Jika Project 999 bukan miliknya atau bukan project yang dapat diaksesnya, sistem harus menolak akses. 

Jangan hanya menyembunyikan tombol di frontend. 

# 6. Project Management 

Setiap project minimal memiliki: 

- Name 

- Description 

- Status 

- Start date 

- Deadline 

- Project Manager 

- Members 

Status project: 

- Planning 

- Active 

- On Hold 

- Completed 

- Cancelled 

Fitur: 

- Create project. 

- Update project. 

- Delete project. 

- Assign Project Manager. 

- Tambah/hapus member. 

- Project progress. 

- Deadline monitoring. 

# 7. Task Management 

Task bukan hanya CRUD sederhana. 

Setiap task minimal memiliki: 

- Title 

- Description 

- Status 

- Priority 

- Assignee 

- Reporter 

- Deadline 

- Labels 

- Attachment 

- Parent task 

- Subtask 

Priority: 

- Low 

- Medium 

- High 

- Critical 

Status: 

- Backlog 

- Todo 

- In Progress 

- Review 

● Done 

# 8. Task Dependency 

Implementasikan dependency antar task. 

Contoh: 

Task A → Task B → Task C 

Task B bergantung pada Task A. 

Business rule: 

- Task B tidak dapat selesai jika Task A belum selesai. 

- Sistem harus melakukan validasi di backend. 

- Error response harus informatif. 

Contoh: 

Task tidak dapat diselesaikan karena masih terdapat dependency yang belum selesai. 

# 9. Kanban Board 

Buat halaman Kanban Board. 

Column: 

- Backlog 

- Todo 

- In Progress 

- Review 

- Done 

Requirement: 

- Drag and drop. 

- Perubahan posisi task disimpan ke database. 

- Task memiliki urutan. 

- Optimistic update. 

- Jika request gagal, state harus dikembalikan. 

- Tidak boleh terjadi duplicate ordering. 

Bonus: 

- Realtime update menggunakan Laravel Reverb atau WebSocket. 

# 10. Approval Workflow 

Beberapa task dapat membutuhkan approval. 

Contoh workflow: 

Developer ↓ Submit for Review ↓ Project Manager ↓ Approved / Revision Required 

Fitur: 

- Submit task untuk review. 

- Approve. 

- Reject. 

- Request revision. 

- Approval comment. 

- Approval history. 

Setiap perubahan status approval harus tercatat. 

# 11. Comment & Discussion 

Setiap task memiliki discussion. 

Fitur: 

- Membuat komentar. 

- Edit komentar. 

- Hapus komentar. 

- Reply komentar. 

- Mention user. 

Contoh: 

@akbar Tolong cek bagian API authentication. 

Bonus: 

- Mention menghasilkan notification. 

# 12. File Attachment 

User dapat mengunggah file ke task. 

Requirement: 

- Validasi MIME type. 

- Validasi ukuran file. 

- Nama file tidak boleh langsung dipercaya. 

- File disimpan menggunakan Laravel Storage. 

- Authorization download file. 

- User tidak boleh mengakses attachment dari project yang tidak memiliki akses. 

# 13. Notification System 

Buat notification untuk: 

- Task assigned. 

- Task deadline mendekat. 

- Comment baru. 

- User mention. 

- Approval accepted. 

- Approval rejected. 

- Project member ditambahkan. 

Minimal implementasi: 

- Database notification. 

- Read/unread state. 

Bonus: 

- Email notification. 

- Queue. 

# 14. Activity & Audit Log 

Setiap aktivitas penting harus dicatat. 

Contoh: 

- Project dibuat. 

- Project diubah. 

- Member ditambahkan. 

- Task dibuat. 

- Status task berubah. 

- Deadline diubah. 

- Task dihapus. 

Audit log minimal menyimpan: 

● User. 

● Action. 

- Entity type. 

- Entity ID. 

● Old value. 

● New value. 

● Timestamp. 

Contoh: 

{ "action": "TASK_STATUS_CHANGED", "old_value": { "status": "todo" }, "new_value": { "status": "in_progress" } } 

Jangan hanya menyimpan: “Task updated” 

# 15. Dashboard 

Dashboard harus berbeda berdasarkan role. 

Contoh informasi: 

- Total project. 

- Project active. 

- Project overdue. 

- Total task. 

- Task selesai. 

- Task overdue. 

- Completion rate. 

- Task berdasarkan status. 

- Workload anggota. 

Perhitungan data harus dilakukan secara efisien. 

Tidak diperbolehkan mengambil seluruh data lalu menghitung semuanya di frontend jika dapat dilakukan melalui query database. 

# 16. Search, Filter & Pagination 

Implementasikan: 

- Search. 

- Filter. 

- Sorting. 

- Pagination. 

Filter task minimal: 

- Status. 

- Priority. 

- Assignee. 

- Project. 

● Deadline. 

- Label. 

Contoh: 

/tasks?status=in_progress&priority=high&page=2 

Requirement: 

- Filter menggunakan server-side query. 

- Search tidak melakukan request berlebihan. 

- Gunakan debounce. 

- Query parameter tetap tersimpan ketika halaman di-refresh. 

# 17. API Standard 

Jika menggunakan REST API, gunakan struktur yang konsisten. 

Contoh: 

### Success 

{ "success": **true** , "message": "Task created successfully", "data": {} } 

### Validation Error 

{ "success": **false** , "message": "Validation failed", "errors": {} } 

Gunakan HTTP status code yang sesuai: 

- 200 

- 201 

● 204 

● 401 

● 403 

● 404 

● 422 

● 500 

# 18. Database Requirements 

Peserta wajib membuat: 

● ERD. 

● Migration. 

- Foreign key. 

- Index yang diperlukan. 

● Relationship Eloquent. 

Database harus mempertimbangkan: 

- Normalisasi. 

● Data integrity. 

● Query performance. 

- Scalability. 

Peserta harus mampu menjelaskan: 

Kenapa tabel dan relasi dibuat seperti itu? 

# 19. Security Requirements 

Minimal menerapkan: 

- Authentication. 

- Authorization. 

- CSRF protection jika menggunakan session authentication. 

- Password hashing. 

- Form Request validation. 

- Mass assignment protection. 

- Secure file upload. 

- Rate limiting pada endpoint tertentu. 

- Tidak mempercayai authorization dari frontend. 

Skenario pengujian: 

User mencoba mengakses atau memodifikasi resource milik project lain menggunakan URL atau API secara langsung. 

Sistem harus menolak request tersebut. 

# 20. Performance Requirements 

Aplikasi harus memperhatikan: 

- N+1 Query Problem. 

- Eager loading. 

- Database indexing. 

- Pagination. 

- Query optimization. 

- Caching. 

- Queue untuk proses berat. 

Peserta wajib melakukan minimal satu analisis performa. 

Contoh: 

Sebelum optimasi halaman project menghasilkan 150 query. Setelah eager loading dan optimasi, jumlah query berkurang menjadi 12. 

# 21. Background Job & Queue 

Minimal implementasikan satu proses asynchronous. 

Contoh: 

- Mengirim email notification. 

- Reminder deadline. 

- Processing file. 

- Generate report. 

Requirement: 

- Menggunakan Laravel Queue. 

- Job dapat gagal tanpa membuat aplikasi crash. 

- Memahami retry mechanism. 

# 22. Testing 

Minimal membuat automated test untuk: 

## Authentication 

- User dapat login. 

- User tanpa autentikasi tidak dapat mengakses protected route. 

## Authorization 

- User tidak dapat mengakses project lain. 

- Member tidak dapat menghapus project. 

- Viewer tidak dapat mengubah task. 

## Business Logic 

- Task dependency. 

- Approval workflow. 

- Status transition. 

## Validation 

- Data wajib. 

- Invalid status. 

- Invalid file. 

- Unauthorized request. 

# 23. Code Quality 

Kode harus: 

- Memiliki struktur yang konsisten. 

- Menggunakan naming yang jelas. 

- Tidak menaruh seluruh business logic di Controller. 

- Tidak membuat file atau class yang tidak diperlukan. 

- Menghindari duplicate code. 

- Memisahkan responsibility dengan baik. 

Peserta diperbolehkan menggunakan: 

- Service Layer. 

- Action Class. 

- Repository Pattern jika memang diperlukan. 

Namun penggunaan pattern harus dapat dijelaskan. 

##### **Jangan menggunakan design pattern hanya karena terlihat kompleks.** 

# 24. Git Requirements 

Wajib menggunakan Git. 

Commit tidak diperbolehkan hanya: 

update fix project 

Gunakan commit yang deskriptif. 

Contoh: 

feat(project): add project member management 

feat(task): implement task dependency validation fix(auth): prevent unauthorized project access 

Minimal terdapat: 

- Main branch. 

- Development branch. 

- Feature branch. 

Bonus: 

- Pull Request workflow. 

- Code review. 

# 25. Dokumentasi 

Repository wajib memiliki: 

## README 

Berisi: 

- Project overview. 

- Tech stack. 

- Requirements. 

- Installation. 

- Environment setup. 

- Database setup. 

- Running queue. 

- Running application. 

## Architecture Documentation 

Jelaskan: 

- Struktur folder. 

- Architecture decision. 

- Authentication flow. 

- Authorization flow. 

- Database design. 

## ERD 

Wajib menyertakan ERD database. 

## API Documentation 

Dokumentasikan: 

- Endpoint. 

- Method. 

- Request. 

- Response. 

- Authentication. 

● Error response. 

# 26. Milestone Pengerjaan — Target 1 Minggu 

Hari 1 — Planning & Foundation 

Target: 

- ●Melakukan requirement analysis. 

- ●Membuat ERD. 

- ●Menentukan application architecture. 

- ●Setup repository dan Git workflow. 

- ●Setup Laravel project. 

- ●Setup database. 

- ●Authentication. 

- ●Role & permission dasar. 

- ●Membuat struktur project. 

Output minimal: 

- ●Laravel application berjalan. 

- ●Authentication berjalan. 

- ●Migration dasar tersedia. 

- ●Seeder user dan role. 

- ●ERD selesai. 

- ●Dokumentasi struktur aplikasi. 

##### **Review:** 

Peserta harus menjelaskan: 

- ●Struktur database. 

- ●Relationship antar tabel. 

- ●Authentication flow. 

- ●Authorization strategy. 

- ●Alasan memilih struktur folder. 

### Hari 2 — Project & Member Management 

Target: 

- ●Project CRUD. 

- ●Project status. 

- ●Project deadline. 

- ●Assign Project Manager. 

- ●Menambahkan member ke project. 

- ●Authorization per project. 

- ●Dashboard awal. 

Business rule: 

- ●User tidak boleh mengakses project yang bukan miliknya. 

- ●Project Manager hanya dapat mengelola project yang ditugaskan kepadanya. 

- ●Member hanya dapat melihat project yang diikutinya. 

Output minimal: 

- ●Project management selesai. 

- ●Member management selesai. 

- ●Authorization backend berjalan. 

##### **Challenge:** 

Coba akses project user lain secara langsung melalui URL atau API. 

Expected result: 

403 Forbidden 

### Hari 3 — Advanced Task Management 

Target: 

- ●Task CRUD. 

- ●Task assignment. 

●Priority. 

●Deadline. 

●Label. 

●Subtask. 

- ●Parent task. 

- ●Attachment. 

●Comment. 

Implementasikan relationship yang benar antara: 

Project │ ── Members├ │ └── Tasks │ ── Assignee├ ── Labels├ ── Attachments├ ── Comments├ └── Subtasks 

Requirement: 

- ●Validasi menggunakan Form Request. ●Authorization menggunakan Policy atau pendekatan Laravel yang sesuai. ●Tidak seluruh business logic diletakkan di Controller. 

Hari 4 — Business Logic & Kanban 

Target: 

- ●Kanban Board. ●Drag and drop. ●Task ordering. 

- ●Task dependency. ●Status transition. ●Approval workflow. 

Business rule wajib: 

Task A 

↓ 

Task B 

Jika Task B memiliki dependency terhadap Task A: 

Task A belum Done 

↓ 

Task B tidak dapat Done 

Implementasikan validasi tersebut di backend. 

Approval workflow: 

Todo 

↓ 

In Progress 

↓ 

Submit for Review 

↓ 

Approved → Done 

atau 

Revision Required 

↓ 

In Progress 

Semua perubahan penting harus tervalidasi. 

### Hari 5 — Collaboration & Audit System 

Target: 

- ●Notification system. 

- ●Read/unread notification. 

- ●Mention user. 

- ●Activity log. 

- ●Audit log. 

- ●Deadline reminder. 

Audit log harus mencatat perubahan. 

Contoh: 

{ "user_id": 1, "action": "TASK_UPDATED", "entity": "task", "entity_id": 15, "old_value": { "priority": "medium" }, 

"new_value": { "priority": "high" 

} } 

Jangan hanya: Task updated 

Bonus: 

●Laravel Notification. 

●Queue. ●Email notification. 

### Hari 6 — Performance, Security & Testing 

Target: 

#### **Performance** 

Lakukan audit: 

- ●N+1 query. 

- ●Eager loading. 

- ●Pagination. 

- ●Database indexing. 

- ●Query optimization. 

- ●Cache. 

Peserta harus menunjukkan minimal satu optimasi nyata. 

Contoh: 

Before: 

120 queries 

After: 

15 queries 

#### **Security** 

Lakukan pengujian: 

- ●Unauthorized access. 

- ●IDOR. 

- ●Invalid request. 

- ●Mass assignment. 

- ●File upload validation. 

- ●Rate limiting. 

#### **Testing** 

Minimal: 

- ●Authentication test. 

- ●Authorization test. 

- ●Task dependency test. 

- ●Approval workflow test. 

- ●Validation test. 

### Hari 7 — Finalization & Technical Review 

Target: 

- ●Bug fixing. 

- ●Code cleanup. 

- ●Refactoring jika diperlukan. 

- ●README. 

- ●API documentation. 

- ●ERD final. 

- ●Deployment. 

- ●Final presentation. 

Peserta wajib melakukan demo end-to-end: 

Create User 

↓ 

Create Project 

- ↓ 

Assign Member 

↓ 

Create Task 

↓ 

Assign Task 

↓ 

Task In Progress 

↓ 

Submit Review 

↓ 

Approval 

↓ 

Task Done 

↓ 

Audit Log 

### Daily Rule 

Setiap akhir hari peserta wajib melakukan: 

- ●Push code ke repository. 

- ●Membuat commit yang jelas. 

- ●Update progress. 

- ●Menuliskan blocker atau masalah yang ditemukan. 

- ●Menjelaskan solusi yang digunakan. 

Format progress: 

## Progress Hari X 

### Completed 

- Authentication 

- Role permission 

- Project CRUD 

### In Progress 

- Project authorization 

##### ### Blocker 

- Belum menemukan struktur terbaik untuk task dependency. 

##### ### Next 

- Menyelesaikan task management. 

### Final Challenge 

Pada hari terakhir, peserta tidak hanya melakukan demo. 

Akan dilakukan technical review secara langsung. 

Contoh pertanyaan: 

1. Kenapa tabel ini dipisahkan? 

2. Kenapa menggunakan relationship ini? 

3. Bagaimana mencegah user mengakses project lain? 

4. Di mana authorization dilakukan? 

5. Bagaimana jika frontend memanipulasi request? 

6. Bagaimana Task Dependency bekerja? 

7. Bagaimana jika dua user mengubah task bersamaan? 

8. Query mana yang paling berat? 

9. Bagaimana mengatasi N+1 Query? 

- 10.Index apa yang digunakan? 

- 11.Kenapa logic ini dibuat di Service, bukan Controller? 

- 12.Jika jumlah user menjadi 100.000, apa yang perlu diubah? 

### Definition of Done 

##### Sebuah fitur **tidak dianggap selesai hanya karena tampil di UI** . 

Fitur dianggap selesai apabila: 

- ●Functional requirement berjalan. 

- ●Backend validation tersedia. 

- ●Authorization tersedia. 

- ●Error handling tersedia. 

- ●Database relationship benar. 

- ●Tidak terdapat security issue dasar. 

- ●Code dapat dijelaskan. 

- ●Minimal testing dilakukan jika fitur memiliki business logic penting. 

- ●Perubahan sudah di-commit ke repository. 

### Catatan 

Target pengerjaan adalah **1 minggu** , sehingga peserta diperbolehkan dan diharapkan menggunakan AI-assisted development untuk mempercepat proses development. 

Namun AI tidak menggantikan pemahaman teknis. 

Setiap kode yang dibuat harus dapat dijelaskan, termasuk: 

- ●Alasan implementasi. 

- ●Alur data. 

- ●Business logic. 

- ●Security. 

- ●Database relationship. 

- ●Trade-off teknis. 

Jika sebuah fitur dibuat menggunakan AI tetapi peserta tidak memahami implementasinya, fitur tersebut dapat dianggap belum memenuhi standar review. 

# 27. Bonus Challenge 

Peserta dapat mengerjakan fitur berikut untuk nilai tambahan. 

## Realtime 

Menggunakan: 

- Laravel Reverb. 

- WebSocket. 

Contoh: 

Ketika User A memindahkan task ke Done, User B langsung melihat perubahan tanpa refresh. 

## Multi-Tenant 

Sistem mendukung beberapa company/organization. 

Setiap data memiliki isolasi tenant. 

Contoh: 

Company A ├── Project A ├── Project B └── Users 

Company B ├── Project C └── Users 

User dari Company A tidak boleh mengakses data Company B. 

## Advanced Search 

Implementasikan: 

- Laravel Scout. 

- Full-text search. 

## Reporting 

Buat report: 

- Project progress. 

- Team productivity. 

- Overdue task. 

- Task completion. 

Bonus: 

- Export PDF. 

● Export Excel. 

# 28. Pertanyaan Saat Final Review 

Peserta harus dapat menjelaskan: 

1. Kenapa memilih arsitektur tersebut? 

2. Kenapa struktur database dibuat seperti itu? 

3. Bagaimana authorization bekerja? 

4. Bagaimana mencegah IDOR atau akses resource milik user lain? 

5. Apa business logic paling kompleks dalam aplikasi? 

6. Bagaimana menangani Task Dependency? 

7. Bagaimana jika dua user mengedit task secara bersamaan? 

8. Apa query paling berat? 

9. Bagaimana cara mengatasi N+1 Query? 

- 10.Index apa yang digunakan dan kenapa? 

- 11.Jika aplikasi digunakan oleh 100.000 user, apa yang perlu diubah? 

- 12.Kenapa menggunakan Service/Action/Repository? 

- 13.Apa trade-off dari arsitektur yang digunakan? 

- 14.Bagaimana menangani job yang gagal? 

- 15.Bagaimana memastikan file upload aman? 

# 29. Rubrik Penilaian 

|Aspek|Bobot|
|---|---|
|Functionality|20%|
|Architecture & Code Structure|20%|
|Database Design|15%|
|Security & Authorization|15%|
|Business Logic|10%|
|Performance & Optimization|5%|
|UI/UX|5%|
|Testing|5%|
|Documentation|5%|
|**Total**|**100%**|



# 30. Deliverables Akhir 

Peserta wajib menyerahkan: 

- Source code. 

- Git repository. 

- README. 

- ERD. 

- API documentation. 

- Architecture documentation. 

- Database migration dan seeder. 

- Automated test. 

- Screenshot atau video demo. 

- Dokumentasi fitur. 

- Known issues. 

- Deployment URL jika tersedia. 

# Catatan Penting 

##### Proyek ini **tidak dinilai hanya berdasarkan apakah fitur berhasil dibuat** . 

Penilaian juga mempertimbangkan: 

- Cara berpikir. 

- Cara merancang database. 

- Cara menangani business logic. 

- Security. 

- Authorization. 

- Kualitas kode. 

- Kemampuan debugging. 

- Kemampuan menjelaskan keputusan teknis. 

Penggunaan AI diperbolehkan sebagai alat bantu, tetapi peserta harus mampu menjelaskan seluruh kode dan keputusan teknis yang digunakan. 

Apabila peserta tidak mampu menjelaskan implementasi yang dibuat, maka bagian tersebut dapat diminta untuk direview, diperbaiki, atau dibuat ulang secara langsung. 

