import React, { useState, useRef, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Task, Comment, TaskAttachment, User } from '@/types';
import {
    X,
    Loader2,
    Trash2,
    Send,
    Paperclip,
    Download,
    CheckSquare,
    Square,
    Plus,
    AlertTriangle,
    CheckCircle2,
    RotateCcw,
    Upload,
    FileText,
    FileImage,
    File,
    MessageSquare,
    Flame,
    ArrowUp,
    Minus,
    ArrowDown,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} jam lalu`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} hari lalu`;
}

function getFileIcon(filetype: string) {
    if (filetype.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-400" />;
    if (filetype === 'application/pdf') return <FileText className="h-4 w-4 text-red-400" />;
    return <File className="h-4 w-4 text-muted" />;
}

const STATUS_LABELS: Record<Task['status'], string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Done',
};

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', Icon: Flame, cls: 'text-red-400 bg-red-400/10 border-red-400/25' },
    high:     { label: 'High',     Icon: ArrowUp, cls: 'text-orange-400 bg-orange-400/10 border-orange-400/25' },
    medium:   { label: 'Medium',   Icon: Minus, cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25' },
    low:      { label: 'Low',      Icon: ArrowDown, cls: 'text-slate-400 bg-slate-400/10 border-slate-400/25' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskDetailModalProps {
    task: Task;
    currentUser: User;
    projectManagerId: number;
    allProjectTasks: Task[];
    projectMembers: User[];
    onClose: () => void;
    onTaskUpdate: (updatedTask: Task) => void;
}

export default function TaskDetailModal({
    task: initialTask,
    currentUser,
    projectManagerId,
    allProjectTasks,
    projectMembers,
    onClose,
    onTaskUpdate,
}: TaskDetailModalProps) {
    const [task, setTask] = useState<Task>(initialTask);
    const [comments, setComments] = useState<Comment[]>(initialTask.comments ?? []);
    const [attachments, setAttachments] = useState<TaskAttachment[]>(initialTask.attachments ?? []);
    const [subtasks, setSubtasks] = useState<Task[]>(initialTask.subtasks ?? []);

    // UI state
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [subtaskInput, setSubtaskInput] = useState('');
    const [addingSubtask, setAddingSubtask] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [deletingTask, setDeletingTask] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploadProcessing, progress, reset: resetUpload } = useForm({ file: null as File | null });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    const isSuperAdmin = currentUser.roles?.some(
        (r: any) => r === 'super_admin' || r?.name === 'super_admin'
    );
    const isProjectManager = currentUser.id === projectManagerId;
    const isCanApprove = isSuperAdmin || isProjectManager;
    const isAssignee = (task.assignees ?? []).some((a) => a.id === currentUser.id);
    const isCanDelete = isSuperAdmin || isProjectManager;

    const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
    const PriorityIcon = priority.Icon;

    // Sync when task prop changes from parent
    useEffect(() => {
        setTask(initialTask);
        setComments(initialTask.comments ?? []);
        setAttachments(initialTask.attachments ?? []);
        setSubtasks(initialTask.subtasks ?? []);
    }, [initialTask]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // ─── Status Change ────────────────────────────────────────────────────────
    const changeStatus = (newStatus: Task['status']) => {
        if (togglingStatus) return;
        setTogglingStatus(true);
        const prev = task.status;
        setTask((t) => ({ ...t, status: newStatus }));

        router.patch(
            `/tasks/${task.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setTask((t) => ({ ...t, status: prev }));
                },
                onFinish: () => setTogglingStatus(false),
            }
        );
    };

    // ─── Subtask Toggle ───────────────────────────────────────────────────────
    const toggleSubtask = (subtask: Task) => {
        const newStatus: Task['status'] = subtask.status === 'done' ? 'todo' : 'done';
        setSubtasks((prev) =>
            prev.map((s) => (s.id === subtask.id ? { ...s, status: newStatus } : s))
        );
        router.patch(
            `/tasks/${subtask.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setSubtasks((prev) =>
                        prev.map((s) => (s.id === subtask.id ? { ...s, status: subtask.status } : s))
                    );
                },
            }
        );
    };

    // ─── Add Subtask ──────────────────────────────────────────────────────────
    const addSubtask = () => {
        if (!subtaskInput.trim() || addingSubtask) return;
        setAddingSubtask(true);
        router.post(
            '/tasks',
            {
                project_id: task.project_id,
                parent_id: task.id,
                title: subtaskInput.trim(),
                status: 'todo',
                priority: 'medium',
                requires_approval: false,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSubtaskInput('');
                },
                onFinish: () => setAddingSubtask(false),
            }
        );
    };

    // ─── Add Comment ──────────────────────────────────────────────────────────
    const submitComment = () => {
        if (!commentText.trim() || submittingComment) return;
        setSubmittingComment(true);

        // Optimistic
        const optimistic: Comment = {
            id: Date.now(),
            task_id: task.id,
            user_id: currentUser.id,
            comment: commentText.trim(),
            created_at: new Date().toISOString(),
            user: currentUser,
        };
        setComments((prev) => [...prev, optimistic]);
        const text = commentText;
        setCommentText('');

        router.post(
            `/tasks/${task.id}/comments`,
            { comment: text },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
                    setCommentText(text);
                },
                onFinish: () => setSubmittingComment(false),
            }
        );
    };

    // ─── Delete Comment ───────────────────────────────────────────────────────
    const deleteComment = (commentId: number) => {
        const snap = [...comments];
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        router.delete(`/comments/${commentId}`, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setComments(snap),
        });
    };

    // ─── Upload Attachment ────────────────────────────────────────────────────
    const uploadFile = (file: File) => {
        if (uploadProcessing) return;
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            alert('File maksimal 10MB');
            return;
        }
        setUploadData('file', file);
    };

    useEffect(() => {
        if (uploadData.file) {
            postUpload(`/tasks/${task.id}/attachments`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetUpload();
                    alert('File uploaded successfully'); // Optional: replace with proper toast if you have one globally accessible
                }
            });
        }
    }, [uploadData.file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    // ─── Delete Task ──────────────────────────────────────────────────────────
    const handleDeleteTask = () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeletingTask(true);
        router.delete(`/tasks/${task.id}`, {
            onSuccess: () => onClose(),
            onFinish: () => setDeletingTask(false),
        });
    };

    // ─── Approval Actions ─────────────────────────────────────────────────────
    const submitForReview = () => changeStatus('review');
    const approveTask     = () => changeStatus('done');
    const requestRevision = () => changeStatus('in_progress');

    const completedSubtasks = subtasks.filter((s) => s.status === 'done').length;
    const blockedDeps = (task.dependencies ?? []).filter((d) => d.status !== 'done');

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="fixed inset-y-0 right-0 z-[160] flex w-full max-w-2xl flex-col bg-surface-1 border-l border-border shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-8 py-6 border-b border-border shrink-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {/* Priority badge */}
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${priority.cls}`}>
                                <PriorityIcon className="h-3 w-3" />
                                {priority.label}
                            </span>

                            {/* Labels */}
                            {(task.labels ?? []).map((l) => (
                                <span
                                    key={l.id}
                                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border"
                                    style={{ backgroundColor: `${l.color}18`, color: l.color, borderColor: `${l.color}35` }}
                                >
                                    {l.name}
                                </span>
                            ))}
                        </div>

                        <h2 className="text-lg font-bold text-foreground leading-snug">
                            {task.title}
                        </h2>

                        {task.description && (
                            <p className="mt-2 text-sm text-muted leading-relaxed whitespace-pre-wrap line-clamp-3">
                                {task.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Delete */}
                        {isCanDelete && (
                            <button
                                id={`delete-task-${task.id}`}
                                onClick={handleDeleteTask}
                                disabled={deletingTask}
                                title={confirmDelete ? 'Klik lagi untuk konfirmasi' : 'Hapus Task'}
                                className={`p-2 rounded-lg transition-colors ${
                                    confirmDelete
                                        ? 'bg-error text-white'
                                        : 'text-muted hover:bg-error/10 hover:text-error'
                                }`}
                            >
                                {deletingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-8 py-6 space-y-8">

                        {/* ── Status Selector ─────────────────────────────── */}
                        <section>
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(STATUS_LABELS) as Task['status'][]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => changeStatus(s)}
                                        disabled={togglingStatus}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                                            task.status === s
                                                ? 'bg-primary/15 border-primary/30 text-primary'
                                                : 'border-border text-muted hover:bg-surface-2 hover:text-foreground'
                                        }`}
                                    >
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Blocked by Dependencies ─────────────────────── */}
                        {blockedDeps.length > 0 && (
                            <section className="rounded-xl bg-orange-400/10 border border-orange-400/20 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                                    <span className="text-sm font-semibold text-orange-400">Blocked — Dependency Belum Selesai</span>
                                </div>
                                <ul className="space-y-1">
                                    {blockedDeps.map((d) => (
                                        <li key={d.id} className="flex items-center gap-2 text-sm text-orange-300">
                                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                                            {d.title}
                                            <span className="text-xs text-orange-400/60 capitalize">({d.status.replace('_', ' ')})</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* ── Meta: Assignees + Dates ──────────────────────── */}
                        <section className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Assignees</h3>
                                {(task.assignees ?? []).length === 0 ? (
                                    <p className="text-sm text-muted">Belum ada assignee</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {(task.assignees ?? []).map((a) => (
                                            <div key={a.id} className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                    {a.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-foreground">{a.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                {task.start_date && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Mulai</h3>
                                        <p className="text-sm text-foreground">
                                            {new Date(task.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                                {task.end_date && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Deadline</h3>
                                        <p className="text-sm text-foreground">
                                            {new Date(task.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ── Approval Workflow ─────────────────────────────── */}
                        {task.requires_approval && (
                            <section className="rounded-xl bg-purple-400/5 border border-purple-400/15 p-5 space-y-3">
                                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Approval Workflow</h3>

                                {/* Member: submit for review */}
                                {isAssignee && !isCanApprove && task.status === 'in_progress' && (
                                    <button
                                        id={`submit-review-${task.id}`}
                                        onClick={submitForReview}
                                        disabled={togglingStatus}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/20 border border-purple-500/30 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-60"
                                    >
                                        {togglingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Kirim untuk Review
                                    </button>
                                )}

                                {/* PM/Admin: approve or request revision */}
                                {isCanApprove && task.status === 'review' && (
                                    <div className="flex gap-3">
                                        <button
                                            id={`approve-task-${task.id}`}
                                            onClick={approveTask}
                                            disabled={togglingStatus}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
                                        >
                                            {togglingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                            Setujui
                                        </button>
                                        <button
                                            id={`revise-task-${task.id}`}
                                            onClick={requestRevision}
                                            disabled={togglingStatus}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500/20 border border-orange-500/30 py-2.5 text-sm font-semibold text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-60"
                                        >
                                            {togglingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                            Minta Revisi
                                        </button>
                                    </div>
                                )}

                                {/* Status indicator */}
                                <div className="text-xs text-muted">
                                    Status saat ini:{' '}
                                    <span className="font-semibold text-purple-300">{STATUS_LABELS[task.status]}</span>
                                </div>
                            </section>
                        )}

                        {/* ── Subtasks Checklist ────────────────────────────── */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                                    Subtasks ({completedSubtasks}/{subtasks.length})
                                </h3>
                                {subtasks.length > 0 && (
                                    <div className="h-1.5 flex-1 mx-4 rounded-full bg-surface-3">
                                        <div
                                            className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                                            style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {subtasks.map((sub) => (
                                    <button
                                        key={sub.id}
                                        id={`subtask-toggle-${sub.id}`}
                                        onClick={() => toggleSubtask(sub)}
                                        className="w-full flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left hover:bg-surface-2 transition-colors group"
                                    >
                                        {sub.status === 'done' ? (
                                            <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                        ) : (
                                            <Square className="h-4 w-4 text-muted shrink-0 group-hover:text-primary transition-colors" />
                                        )}
                                        <span
                                            className={`text-sm transition-colors ${
                                                sub.status === 'done'
                                                    ? 'line-through text-muted'
                                                    : 'text-foreground'
                                            }`}
                                        >
                                            {sub.title}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Add Subtask Input */}
                            <div className="flex gap-2 mt-3">
                                <input
                                    type="text"
                                    placeholder="+ Tambah subtask..."
                                    value={subtaskInput}
                                    onChange={(e) => setSubtaskInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }}
                                    className="flex-1 rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    id={`add-subtask-${task.id}`}
                                    onClick={addSubtask}
                                    disabled={addingSubtask || !subtaskInput.trim()}
                                    className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
                                >
                                    {addingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </button>
                            </div>
                        </section>

                        {/* ── Attachments ───────────────────────────────────── */}
                        <section>
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                                Lampiran ({attachments.length})
                            </h3>

                            {/* File list */}
                            {attachments.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {attachments.map((att) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
                                        >
                                            {getFileIcon(att.filetype)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{att.filename}</p>
                                                <p className="text-xs text-muted">{formatBytes(att.filesize)}</p>
                                            </div>
                                            <a
                                                href={`/attachments/${att.id}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Download"
                                                className="p-1.5 rounded-lg text-muted hover:bg-surface-3 hover:text-foreground transition-colors"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload dropzone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-all ${
                                    dragOver
                                        ? 'border-primary/60 bg-primary/5'
                                        : 'border-border hover:border-border-light hover:bg-surface-2'
                                }`}
                            >
                                {uploadingFile ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5 text-muted" />
                                        <p className="text-xs text-muted text-center">
                                            Drag &amp; drop atau{' '}
                                            <span className="text-primary font-medium">klik untuk upload</span>
                                            <br />
                                            <span className="text-muted-foreground">JPG, PNG, PDF, DOCX, XLSX, ZIP, TXT · maks 10MB</span>
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.zip,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </section>

                        {/* ── Comments ──────────────────────────────────────── */}
                        <section>
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Diskusi ({comments.length})
                            </h3>

                            {/* Comment Thread */}
                            <div className="space-y-4 mb-4">
                                {comments.length === 0 && (
                                    <p className="text-sm text-muted text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
                                )}
                                {comments.map((c) => {
                                    const canDelete =
                                        currentUser.id === c.user_id || isSuperAdmin;
                                    return (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                                                {c.user?.username?.charAt(0).toUpperCase() ?? '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {c.user?.username ?? 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                                                    {c.comment.split(/(@\w+)/g).map((part, i) => 
                                                        part.startsWith('@') ? (
                                                            <span key={i} className="font-semibold text-[#91D1F2] bg-[#FCA5C1]/10 px-1 rounded-sm">
                                                                {part}
                                                            </span>
                                                        ) : (
                                                            part
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                            {canDelete && (
                                                <button
                                                    id={`delete-comment-${c.id}`}
                                                    onClick={() => deleteComment(c.id)}
                                                    title="Hapus komentar"
                                                    className="p-1.5 rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors shrink-0 self-start"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* New Comment Input */}
                            <div className="flex gap-2 items-end relative">
                                <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                    {currentUser.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={commentInputRef}
                                        id={`comment-input-${task.id}`}
                                        placeholder="Tulis komentar... (Gunakan @ untuk mention, Enter untuk kirim)"
                                        value={commentText}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCommentText(val);
                                            const match = val.match(/@(\w*)$/);
                                            if (match) {
                                                setMentionSearch(match[1].toLowerCase());
                                            } else {
                                                setMentionSearch(null);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                submitComment();
                                            }
                                        }}
                                        rows={2}
                                        className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 pr-10 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                    <button
                                        id={`submit-comment-${task.id}`}
                                        onClick={submitComment}
                                        disabled={submittingComment || !commentText.trim()}
                                        className="absolute right-2 bottom-2 p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
                                    >
                                        {submittingComment ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                
                                {/* Mentions Dropdown */}
                                {mentionSearch !== null && (
                                    <div className="absolute bottom-full left-9 mb-1 w-64 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface-1 shadow-xl z-[200]">
                                        {projectMembers
                                            .filter(m => m.id !== currentUser.id && m.username.toLowerCase().includes(mentionSearch))
                                            .map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setCommentText(prev => prev.replace(/@\w*$/, `@${m.username} `));
                                                    setMentionSearch(null);
                                                    commentInputRef.current?.focus();
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface-2 transition-colors flex items-center gap-2"
                                            >
                                                <div className="h-5 w-5 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                                                    {m.username.charAt(0).toUpperCase()}
                                                </div>
                                                {m.username}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </>
    );
}
