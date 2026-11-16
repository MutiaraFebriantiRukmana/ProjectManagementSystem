<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ActivityLog::with('user:id,username,email')->latest();

        // Filter User
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter Action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs'    => $logs,
            'users'   => User::select('id', 'username')->orderBy('username')->get(),
            'actions' => ActivityLog::select('action')->distinct()->pluck('action'),
            'filters' => $request->only(['user_id', 'action']),
        ]);
    }
}