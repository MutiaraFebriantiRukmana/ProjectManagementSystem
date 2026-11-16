<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\Task;
use App\Notifications\TaskReviewSubmittedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ApprovalController extends Controller
{
    /**
     * 1. Member Mengajukan Task untuk Review (Status -> review)
     */
    public function submitReview(Request $request, Task $task): RedirectResponse
    {
        Gate::authorize('changeStatus', $task);

        $task->update(['status' => 'review']);

        // Catat di tabel approvals
        Approval::create([
            'task_id'     => $task->id,
            'status'      => 'pending',
            'notes'       => $request->input('notes', 'Mengajukan review penyelesaian task.'),
        ]);

        // Kirim notifikasi ke Project Manager
        $manager = $task->project->manager;
        if ($manager && $manager->id !== Auth::id()) {
            $manager->notify(new TaskReviewSubmittedNotification($task, $request->user()));
        }

        return back()->with('success', 'Task berhasil diajukan untuk review.');
    }

    /**
     * 2. PM / Super Admin Menyetujui Task (Status -> done)
     */
    public function approve(Request $request, Task $task): RedirectResponse
    {
        $project = $task->project;
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Hanya PM pengampu project atau Super Admin yang boleh approve
        if ($project->manager_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Hanya Project Manager yang berhak menyetujui approval ini.');
        }

        $task->update(['status' => 'done']);

        // Catat Approval Approved
        Approval::create([
            'task_id'     => $task->id,
            'approved_by' => $user->id,
            'status'      => 'approved',
            'notes'       => $request->input('notes', 'Task disetujui.'),
        ]);

        return back()->with('success', 'Task telah disetujui dan berstatus Done.');
    }

    /**
     * 3. PM / Super Admin Meminta Revisi (Status -> in_progress)
     */
    public function reject(Request $request, Task $task): RedirectResponse
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $project = $task->project;
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($project->manager_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Hanya Project Manager yang berhak meminta revisi.');
        }

        // Kembalikan status task ke in_progress
        $task->update(['status' => 'in_progress']);

        // Catat riwayat revisi
        Approval::create([
            'task_id'     => $task->id,
            'approved_by' => $user->id,
            'status'      => 'revision_required',
            'notes'       => $request->input('notes'),
        ]);

        return back()->with('success', 'Permintaan revisi berhasil dikirimkan ke anggota tim.');
    }
}