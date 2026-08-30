<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Notifications\CommentMentionNotification;
use Illuminate\Support\Str;

class MentionParserService
{
    /**
     * Ekstrak @username dari teks komentar dan kirim notifikasi ke user terkait.
     */
    public function parseAndNotify(string $commentText, Task $task, User $sender): void
    {
        // Regex untuk mencari pola @username
        preg_match_all('/@([a-zA-Z0-9_\-\.]+)/', $commentText, $matches);

        if (empty($matches[1])) {
            return;
        }

        $usernames = array_unique($matches[1]);

        $mentionedUsers = User::whereIn('username', $usernames)
            ->where('id', '!=', $sender->id) // Jangan notif diri sendiri
            ->get();

        $snippet = Str::limit(strip_tags($commentText), 80);

        foreach ($mentionedUsers as $user) {
            $user->notify(new CommentMentionNotification($task, $sender, $snippet));
        }
    }
}