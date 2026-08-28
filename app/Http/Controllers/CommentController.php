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
    public function store(Request $request, Task $task): RedirectResponse
    {
        Gate::authorize('view', $task);

        $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $comment = $task->comments()->create([
            'user_id' => Auth::id(),
            'comment' => $request->comment,
        ]);

        preg_match_all('/@(\w+)/', $request->comment, $matches);
        if (!empty($matches[1])) {
            $usernames = array_unique($matches[1]);
            
            $project = $task->project;
            $memberIds = $project->members()->pluck('users.id')->toArray();
            if ($project->manager_id) {
                $memberIds[] = $project->manager_id;
            }

            $userIds = User::whereIn('username', $usernames)
                ->whereIn('id', $memberIds)
                ->where('id', '!=', Auth::id()) // Self-mention protection
                ->pluck('id');

            if ($userIds->isNotEmpty()) {
                $comment->mentions()->sync($userIds);
            }
        }

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