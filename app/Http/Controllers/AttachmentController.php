<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    /**
     * Upload File Aman (Validasi MIME & Size) — Poin 12 Brief.
     */
    public function store(Request $request, Task $task): RedirectResponse
    {
        Gate::authorize('view', $task);

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240', // Maksimal 10MB
                'mimes:jpg,jpeg,png,pdf,docx,xlsx,zip,txt', // Validasi tipe file
            ],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        // Simpan dengan nama acak/hash di storage private
        $path = $file->store('task_attachments', 'local');

        $task->attachments()->create([
            'user_id'  => Auth::id(),
            'filename' => $originalName,
            'filepath' => $path,
            'filesize' => $file->getSize(),
            'filetype' => $file->getClientMimeType(),
        ]);

        return back()->with('success', 'File berhasil diunggah.');
    }

    /**
     * Download File dengan Otorisasi Anti-IDOR — Poin 12 Brief.
     */
    public function download(TaskAttachment $attachment): StreamedResponse
    {
        Gate::authorize('view', $attachment->task);

        if (!Storage::disk('local')->exists($attachment->filepath)) {
            abort(404, 'File fisik tidak ditemukan.');
        }

        // Memanggil langsung Storage::download() agar type-hint dikenali sempurna oleh IDE
        return Storage::download($attachment->filepath, $attachment->filename);
    }
}