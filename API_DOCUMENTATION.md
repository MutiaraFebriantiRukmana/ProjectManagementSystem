# API Documentation Standards

Aplikasi ini menggunakan perpaduan **Inertia.js** (untuk interaksi frontend React dan backend Laravel secara _seamless_) serta **REST API** untuk *endpoint* asinkron tertentu dan konsistensi respons.

## Standar Format Respons REST API

Ketika sebuah *request* diarahkan ke *endpoint* API (misalnya rute di bawah `routes/api.php` atau *endpoint* AJAX khusus), aplikasi **wajib** mengembalikan format JSON yang konsisten.

### 1. Success Response (2xx)
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Setup Database",
    "status": "todo"
  }
}
```

### 2. Validation Error Response (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "priority": ["The selected priority is invalid."]
  }
}
```

### 3. Client/Server Error Response (4xx, 500)
```json
{
  "success": false,
  "message": "You do not have permission to access this project.",
  "error_code": "FORBIDDEN_ACCESS"
}
```

## Standar HTTP Status Codes
Setiap *response* harus menggunakan kode status HTTP yang relevan:
- `200 OK`: Sukses secara umum (GET, PUT, PATCH).
- `201 Created`: Berhasil membuat *resource* baru (POST).
- `204 No Content`: Berhasil menghapus *resource* (DELETE).
- `401 Unauthorized`: Kredensial tidak valid (belum login).
- `403 Forbidden`: User sudah login, namun hak akses (Authorization) tidak mencukupi.
- `404 Not Found`: *Resource* tidak ditemukan.
- `422 Unprocessable Entity`: Gagal validasi *Form Request*.
- `500 Internal Server Error`: *Error* dari sisi server/database.

## Inertia.js API Handling
Untuk rute berbasis web yang dilayani melalui Inertia (e.g., `Inertia::render()`), *response* tidak selalu dalam bentuk JSON statis di atas. Framework otomatis menangani pengiriman data *props* ke komponen React frontend. Namun, validasi error tetap mengikuti format bawaan Inertia yang akan di-*inject* ke dalam `usePage().props.errors`.
