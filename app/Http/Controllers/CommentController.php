<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function store(Request $request, Task $task, \App\Services\MentionParserService $mentionParser): RedirectResponse
    {
        Gate::authorize('view', $task);

        $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $task->comments()->create([
            'user_id' => $user->id,
            'comment' => $request->comment,
        ]);

        // Panggil Engine Mention Parser
        $mentionParser->parseAndNotify($request->comment, $task, $user);

        return back()->with('success', 'Komentar berhasil ditambahkan.');
    }

    public function destroy(Request $request, Comment $comment): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Hanya pembuat komentar atau Super Admin yang boleh hapus
        if ($user->id !== $comment->user_id && !$user->hasRole('super_admin')) {
            abort(403, 'Anda tidak berhak menghapus komentar ini.');
        }

        $comment->delete();

        return back()->with('success', 'Komentar berhasil dihapus.');
    }
}