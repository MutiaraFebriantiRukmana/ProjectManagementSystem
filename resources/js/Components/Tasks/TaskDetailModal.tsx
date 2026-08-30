import React, { useState, useRef, useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Task, Comment, TaskAttachment, User, Approval } from '@/types';
import {
    X,
    Loader2,
    Trash2,
    Send,
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
    ShieldCheck,
    SendHorizonal,
    CheckCircle,
    XCircle,
    History,
    Clock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import ConfirmModal from '@/Components/ConfirmModal';
import { hasPermission } from '@/utils/permissions';

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

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
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
    critical: { label: 'Critical', Icon: Flame,     cls: 'text-red-400 bg-red-400/10 border-red-400/25' },
    high:     { label: 'High',     Icon: ArrowUp,   cls: 'text-orange-400 bg-orange-400/10 border-orange-400/25' },
    medium:   { label: 'Medium',   Icon: Minus,     cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25' },
    low:      { label: 'Low',      Icon: ArrowDown, cls: 'text-slate-400 bg-slate-400/10 border-slate-400/25' },
};

// ─── Approval Status Config ───────────────────────────────────────────────────
const APPROVAL_STATUS_CONFIG: Record<
    Approval['status'],
    { label: string; dotCls: string; badgeCls: string; Icon: React.ElementType }
> = {
    pending:           { label: 'Menunggu Review',  dotCls: 'bg-warning',   badgeCls: 'text-warning bg-warning/10 border-warning/25',     Icon: Clock },
    approved:          { label: 'Disetujui',         dotCls: 'bg-success',   badgeCls: 'text-success bg-success/10 border-success/25',     Icon: CheckCircle },
    rejected:          { label: 'Ditolak',           dotCls: 'bg-error',     badgeCls: 'text-error bg-error/10 border-error/25',           Icon: XCircle },
    revision_required: { label: 'Revisi Diminta',    dotCls: 'bg-error',     badgeCls: 'text-error bg-error/10 border-error/25',           Icon: RotateCcw },
};

function getApprovalDisplayStatus(task: Task): Approval['status'] | null {
    const approvals = task.approvals ?? [];
    if (approvals.length === 0) {
        if (task.status === 'review') return 'pending';
        if (task.status === 'done')   return 'approved';
        return null;
    }
    return approvals[approvals.length - 1].status;
}

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
    const [deletingTask, setDeletingTask] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);

    // Editing assignee state
    const [editingAssignees, setEditingAssignees] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>((initialTask.assignees ?? []).map(a => a.id));
    const [updatingAssignees, setUpdatingAssignees] = useState(false);

    const [confirmSaveAssignees, setConfirmSaveAssignees] = useState(false);
    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<number | null>(null);

    // ── Approval Workflow state ────────────────────────────────────────────────
    const [submittingReview, setSubmittingReview] = useState(false);
    const [approvingTask, setApprovingTask]       = useState(false);
    const [rejectingTask, setRejectingTask]       = useState(false);
    const [showRevisionInput, setShowRevisionInput] = useState(false);
    const [revisionNote, setRevisionNote]           = useState('');
    const [approveNote, setApproveNote]             = useState('');
    const [showApproveNote, setShowApproveNote]     = useState(false);
    const [showHistory, setShowHistory]             = useState(false);
    
    // Confirm Modals for Workflow
    const [confirmSubmitReview, setConfirmSubmitReview] = useState(false);
    const [confirmApprove, setConfirmApprove] = useState(false);
    const [confirmReject, setConfirmReject] = useState(false);

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploadProcessing, reset: resetUpload } = useForm({ file: null as File | null });

    const fileInputRef    = useRef<HTMLInputElement>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    // Ambil role secara aman
    const rawRole  = currentUser?.roles?.[0];
    const roleName = typeof rawRole === 'object' ? rawRole?.name : (rawRole || 'member');

    const isSuperAdmin     = roleName === 'super_admin';
    const isProjectManager = currentUser.id === projectManagerId;
    const isCanApprove     = isProjectManager;
    const isCanManageTask  = isSuperAdmin || isProjectManager;
    const canEditTask      = isSuperAdmin || isProjectManager;
    const isAssignee       = (task.assignees ?? []).some((a) => a.id === currentUser.id);
    const isReporter       = currentUser.id === task.reporter_id;
    const isCanDelete      = isSuperAdmin || isProjectManager;

    const priority         = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
    const PriorityIcon = priority.Icon;

    useEffect(() => {
        setTask(initialTask);
        setComments(initialTask.comments ?? []);
        setAttachments(initialTask.attachments ?? []);
        setSubtasks(initialTask.subtasks ?? []);
    }, [initialTask]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const changeStatus = (newStatus: Task['status']) => {
        if (togglingStatus) return;
        setTogglingStatus(true);
        const prev = task.status;
        setTask((t) => ({ ...t, status: newStatus }));

        router.patch(`/tasks/${task.id}/status`, { status: newStatus }, {
                preserveScroll: true,
                preserveState: true,
                onError: () => setTask((t) => ({ ...t, status: prev })),
                onFinish: () => setTogglingStatus(false),
            }
        );
    };

    const toggleSubtask = (subtask: Task) => {
        const newStatus: Task['status'] = subtask.status === 'done' ? 'todo' : 'done';
        setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, status: newStatus } : s)));
        router.patch(`/tasks/${subtask.id}/status`, { status: newStatus }, {
                preserveScroll: true,
                preserveState: true,
                onError: () => setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, status: subtask.status } : s))),
            }
        );
    };

    const addSubtask = () => {
        if (!subtaskInput.trim() || addingSubtask) return;
        setAddingSubtask(true);
        router.post('/tasks', {
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
                onSuccess: () => setSubtaskInput(''),
                onFinish: () => setAddingSubtask(false),
            }
        );
    };

    const submitComment = () => {
        if (!commentText.trim() || submittingComment) return;
        setSubmittingComment(true);

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

        router.post(`/tasks/${task.id}/comments`, { comment: text }, {
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

    const deleteComment = () => {
        if (confirmDeleteCommentId === null) return;
        const commentId = confirmDeleteCommentId;
        const snap = [...comments];
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setConfirmDeleteCommentId(null);
        router.delete(`/comments/${commentId}`, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setComments(snap),
        });
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setCommentText(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPosition);
        
        const match = textBeforeCursor.match(/@(\w*)$/);
        
        if (match) {
            setMentionSearch(match[1]);
        } else {
            setMentionSearch(null);
        }
    };

    const insertMention = (username: string) => {
        if (!commentInputRef.current) return;
        const cursorPosition = commentInputRef.current.selectionStart;
        const textBeforeCursor = commentText.slice(0, cursorPosition);
        const textAfterCursor = commentText.slice(cursorPosition);
        
        const match = textBeforeCursor.match(/@(\w*)$/);
        if (match) {
            const beforeMention = textBeforeCursor.slice(0, match.index);
            const newText = beforeMention + `@${username} ` + textAfterCursor;
            setCommentText(newText);
            setMentionSearch(null);
            setTimeout(() => commentInputRef.current?.focus(), 10);
        }
    };

    const filteredMentions = mentionSearch !== null
        ? projectMembers.filter(
            u => u.id !== currentUser.id && 
                 u.username.toLowerCase().includes(mentionSearch.toLowerCase())
          )
        : [];


    const uploadFile = (file: File) => {
        if (uploadProcessing) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('File maksimal 10MB');
            return;
        }
        setPendingUploadFile(file);
    };

    const confirmUpload = () => {
        if (!pendingUploadFile) return;
        setUploadData('file', pendingUploadFile);
    };

    useEffect(() => {
        if (uploadData.file) {
            postUpload(`/tasks/${task.id}/attachments`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetUpload();
                    setPendingUploadFile(null);
                },
                onError: () => setPendingUploadFile(null)
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

    const handleDeleteTask = () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeletingTask(true);
        router.delete(`/tasks/${task.id}`, {
            onSuccess: () => onClose(),
            onFinish: () => setDeletingTask(false),
        });
    };

    // ── Approval Workflow Actions ──────────────────────────────────────────────
    const submitForReview = () => {
        if (submittingReview) return;
        setSubmittingReview(true);
        setTask((t) => ({ ...t, status: 'review' }));
        router.post(
            `/tasks/${task.id}/submit-review`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setTask((t) => ({ ...t, status: 'in_progress' })),
                onFinish: () => setSubmittingReview(false),
            }
        );
    };

    const approveTask = () => {
        if (approvingTask) return;
        setApprovingTask(true);
        const notes = approveNote.trim() || 'Task disetujui.';
        setTask((t) => ({ ...t, status: 'done' }));
        router.post(
            `/tasks/${task.id}/approve`,
            { notes },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setTask((t) => ({ ...t, status: 'review' })),
                onFinish: () => {
                    setApprovingTask(false);
                    setShowApproveNote(false);
                    setApproveNote('');
                },
            }
        );
    };

    const requestRevision = () => {
        if (!revisionNote.trim() || rejectingTask) return;
        setRejectingTask(true);
        setTask((t) => ({ ...t, status: 'in_progress' }));
        router.post(
            `/tasks/${task.id}/reject`,
            { notes: revisionNote.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setTask((t) => ({ ...t, status: 'review' })),
                onFinish: () => {
                    setRejectingTask(false);
                    setShowRevisionInput(false);
                    setRevisionNote('');
                },
            }
        );
    };

    const completedSubtasks = subtasks.filter((s) => s.status === 'done').length;
    const blockedDeps       = (task.dependencies ?? []).filter((d) => d.status !== 'done');

    const saveAssignees = () => {
        if (updatingAssignees) return;
        setUpdatingAssignees(true);
        setConfirmSaveAssignees(false);
        router.patch(`/tasks/${task.id}`, { assignees: selectedAssignees }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setEditingAssignees(false),
                onFinish: () => setUpdatingAssignees(false),
            }
        );
    };

    const toggleAssignee = (userId: number) => {
        setSelectedAssignees(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const approvalDisplayStatus = task.requires_approval ? getApprovalDisplayStatus(task) : null;
    const approvals             = task.approvals ?? [];

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Centered Modal Panel */}
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none">
                <div className="flex w-full max-w-2xl flex-col bg-surface-1 rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] pointer-events-auto">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-8 py-6 border-b border-border shrink-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${priority.cls}`}>
                                    <PriorityIcon className="h-3 w-3" />
                                    {priority.label}
                                </span>
                                {task.requires_approval && (
                                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-primary/25 bg-primary/10 text-primary">
                                        <ShieldCheck className="h-3 w-3" />
                                        Butuh Approval
                                    </span>
                                )}
                                {(task.labels ?? []).map((l) => (
                                    <span key={l.id} className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border" style={{ backgroundColor: `${l.color}18`, color: l.color, borderColor: `${l.color}35` }}>
                                        {l.name}
                                    </span>
                                ))}
                            </div>
                            <h2 className="text-lg font-bold text-foreground leading-snug">{task.title}</h2>
                            {task.description && (
                                <p className="mt-2 text-sm text-muted leading-relaxed whitespace-pre-wrap line-clamp-3">{task.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {isCanDelete && (
                                <button onClick={handleDeleteTask} disabled={deletingTask} className={`p-2 rounded-lg transition-colors ${confirmDelete ? 'bg-error text-white' : 'text-muted hover:bg-error/10 hover:text-error'}`}>
                                    {deletingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-8 py-6 space-y-8">
                            
                            {/* Status Selector */}
                            <section>
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(STATUS_LABELS) as Task['status'][]).map((s) => {
                                        // 🔒 BLOKIR MANUAL CLICK KE 'REVIEW' & 'DONE' JIKA TASK MEMERLUKAN APPROVAL
                                        const isApprovalRestricted = task.requires_approval && (s === 'review' || s === 'done');
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => !isApprovalRestricted && changeStatus(s)}
                                                disabled={togglingStatus || isApprovalRestricted}
                                                title={isApprovalRestricted ? 'Gunakan alur Approval di bawah untuk status ini' : undefined}
                                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                                                    task.status === s
                                                        ? 'bg-primary/15 border-primary/30 text-primary'
                                                        : isApprovalRestricted
                                                        ? 'border-border/40 text-muted/30 cursor-not-allowed bg-surface-2/20'
                                                        : 'border-border text-muted hover:bg-surface-2 hover:text-foreground'
                                                }`}
                                            >
                                                {STATUS_LABELS[s]}
                                            </button>
                                        );
                                    })}
                                </div>
                                {task.requires_approval && (
                                    <p className="text-[11px] text-muted mt-2 italic">
                                        * Status <span className="text-primary font-medium">In Review</span> dan <span className="text-success font-medium">Done</span> dikendalikan lewat tombol <strong>Approval Workflow</strong> di bawah.
                                    </p>
                                )}
                            </section>

                            {/* Blocked info */}
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
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* ══ APPROVAL WORKFLOW SECTION ══════════════════════════════════════ */}
                            {task.requires_approval && (
                                <section className="rounded-xl border border-border bg-surface-2/50 p-4 space-y-4">
                                    {/* Section header */}
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Approval Workflow</h3>
                                    </div>

                                    {/* ── Status Banner ── */}
                                    {approvalDisplayStatus ? (() => {
                                        const cfg = APPROVAL_STATUS_CONFIG[approvalDisplayStatus];
                                        const BannerIcon = cfg.Icon;
                                        return (
                                            <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${cfg.badgeCls}`}>
                                                <BannerIcon className="h-4 w-4 shrink-0" />
                                                {cfg.label}
                                            </div>
                                        );
                                    })() : (
                                        <div className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted">
                                            <Clock className="h-4 w-4 shrink-0" />
                                            Belum diajukan untuk review
                                        </div>
                                    )}

                                    {/* ── Role-Gated Action Buttons ── */}
                                    <div className="space-y-3">
                                        {/* Member / Assignee / Reporter / PM: submit for review saat task berstatus todo / in_progress */}
                                        {(isAssignee || isReporter || isCanApprove) && ['todo', 'in_progress'].includes(task.status) && (
                                            <button
                                                onClick={() => setConfirmSubmitReview(true)}
                                                disabled={submittingReview}
                                                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 active:scale-[0.98] transition-all disabled:opacity-60"
                                            >
                                                {submittingReview
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <SendHorizonal className="h-4 w-4" />
                                                }
                                                Kirim untuk Review
                                            </button>
                                        )}

                                        {/* PM / Admin: approve or request revision saat status in review */}
                                        {isCanApprove && task.status === 'review' && (
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Approve button */}
                                                    <button
                                                        onClick={() => { setConfirmApprove(true); setApproveNote(''); }}
                                                        disabled={approvingTask}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success hover:bg-success/20 active:scale-[0.98] transition-all disabled:opacity-60"
                                                    >
                                                        {approvingTask
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <CheckCircle className="h-4 w-4" />
                                                        }
                                                        Setujui
                                                    </button>

                                                    {/* Request revision button */}
                                                    <button
                                                        onClick={() => { setConfirmReject(true); setRevisionNote(''); }}
                                                        disabled={rejectingTask}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/20 active:scale-[0.98] transition-all disabled:opacity-60"
                                                    >
                                                        {rejectingTask
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <XCircle className="h-4 w-4" />
                                                        }
                                                        Minta Revisi
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Approval History Timeline ── */}
                                    {approvals.length > 0 && (
                                        <div className="border-t border-border pt-3 space-y-2">
                                            <button
                                                onClick={() => setShowHistory((v) => !v)}
                                                className="flex items-center justify-between text-xs font-semibold text-muted hover:text-foreground transition-colors w-full text-left"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <History className="h-3.5 w-3.5" />
                                                    Riwayat Approval ({approvals.length})
                                                </span>
                                                {showHistory
                                                    ? <ChevronUp className="h-3.5 w-3.5" />
                                                    : <ChevronDown className="h-3.5 w-3.5" />
                                                }
                                            </button>

                                            {showHistory && (
                                                <div className="relative mt-3 space-y-0 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {approvals.length > 1 && (
                                                        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
                                                    )}
                                                    {approvals.map((approval, idx) => {
                                                        const cfg = APPROVAL_STATUS_CONFIG[approval.status];
                                                        const EntryIcon = cfg.Icon;
                                                        return (
                                                            <div key={approval.id} className="relative flex gap-3 pb-4 last:pb-0">
                                                                <div className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-surface-1 shrink-0 mt-0.5 ${cfg.dotCls}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${cfg.badgeCls}`}>
                                                                            <EntryIcon className="h-2.5 w-2.5" />
                                                                            {cfg.label}
                                                                        </span>
                                                                        <span className="text-xs font-semibold text-foreground">
                                                                            {approval.approver?.username ?? 'System'}
                                                                        </span>
                                                                        <span className="text-[10px] text-muted ml-auto">
                                                                            {timeAgo(approval.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    {approval.notes && (
                                                                        <p className="text-xs text-muted leading-relaxed mt-1 italic">
                                                                            "{approval.notes}"
                                                                        </p>
                                                                    )}
                                                                    <p className="text-[10px] text-muted/60 mt-0.5">
                                                                        {formatDateTime(approval.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}
                            {/* ══ END APPROVAL WORKFLOW SECTION ══════════════════════════════════ */}

                            {/* Assignees & Dates */}
                            <section className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Assignees</h3>
                                        {isCanApprove && (
                                            <button onClick={() => setEditingAssignees(!editingAssignees)} className="text-[10px] font-semibold text-primary hover:underline">
                                                {editingAssignees ? 'Tutup' : 'Edit'}
                                            </button>
                                        )}
                                    </div>
                                    {editingAssignees ? (
                                        <div className="space-y-2 p-3 border border-border rounded-xl bg-surface-2 max-h-40 overflow-y-auto">
                                            {projectMembers.map(m => (
                                                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={selectedAssignees.includes(m.id)} onChange={() => toggleAssignee(m.id)} className="rounded border-border text-primary focus:ring-primary/20 bg-surface-1" />
                                                    <span className="text-sm text-foreground">{m.username}</span>
                                                </label>
                                            ))}
                                            <button onClick={() => setConfirmSaveAssignees(true)} disabled={updatingAssignees} className="mt-2 w-full rounded-lg bg-primary/10 border border-primary/20 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                                                {updatingAssignees ? 'Menyimpan...' : 'Simpan'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {(task.assignees ?? []).map((a) => (
                                                <div key={a.id} className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{a.username?.charAt(0).toUpperCase()}</div>
                                                    <span className="text-sm text-foreground">{a.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {task.end_date && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Deadline</h3>
                                            <p className="text-sm text-foreground">{new Date(task.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Subtasks */}
                            <section>
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Subtasks ({completedSubtasks}/{subtasks.length})</h3>
                                <div className="space-y-2">
                                    {subtasks.map((sub) => (
                                        <button key={sub.id} onClick={() => toggleSubtask(sub)} className="w-full flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left hover:bg-surface-2 transition-colors group">
                                            {sub.status === 'done' ? <CheckSquare className="h-4 w-4 text-primary shrink-0" /> : <Square className="h-4 w-4 text-muted shrink-0 group-hover:text-primary transition-colors" />}
                                            <span className={`text-sm ${sub.status === 'done' ? 'line-through text-muted' : 'text-foreground'}`}>{sub.title}</span>
                                        </button>
                                    ))}
                                </div>
                                {canEditTask && (
                                    <div className="flex gap-2 mt-3">
                                        <input type="text" placeholder="+ Tambah subtask..." value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }} className="flex-1 rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                        <button onClick={addSubtask} disabled={addingSubtask || !subtaskInput.trim()} className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                                            {addingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* Attachments */}
                            <section>
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Lampiran ({attachments.length})</h3>
                                <div className="space-y-2 mb-3">
                                    {attachments.map((att) => (
                                        <div key={att.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                                            {getFileIcon(att.filetype)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{att.filename}</p>
                                                <p className="text-xs text-muted">{formatBytes(att.filesize)}</p>
                                            </div>
                                            <a href={`/attachments/${att.id}/download`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted hover:bg-surface-3 hover:text-foreground transition-colors"><Download className="h-4 w-4" /></a>
                                        </div>
                                    ))}
                                </div>
                                <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-all ${dragOver ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-surface-2'}`}>
                                    <Upload className="h-5 w-5 text-muted" />
                                    <p className="text-xs text-muted">Klik atau drop untuk upload</p>
                                </div>
                                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                            </section>

                            {/* Comments */}
                            <section>
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Diskusi ({comments.length})</h3>
                                <div className="space-y-4 mb-4">
                                    {comments.map((c) => (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">{c.user?.username?.charAt(0).toUpperCase()}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-foreground">{c.user?.username}</span>
                                                    <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                                                    {c.comment.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className="font-semibold text-[#91D1F2] bg-[#FCA5C1]/10 px-1 rounded-sm">{part}</span> : part)}
                                                </p>
                                            </div>
                                            {(currentUser.id === c.user_id || isSuperAdmin) && (
                                                <button onClick={() => setConfirmDeleteCommentId(c.id)} className="p-1.5 rounded-lg text-muted hover:text-error transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-end relative">
                                    {mentionSearch !== null && filteredMentions.length > 0 && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface-1 shadow-xl z-50 p-1">
                                            {filteredMentions.map(u => (
                                                <button key={u.id} onClick={() => insertMention(u.username)} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-2 transition-colors flex flex-col">
                                                    <span className="font-semibold text-foreground">{u.username}</span>
                                                    <span className="text-xs text-muted">{u.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <textarea ref={commentInputRef} placeholder="Tulis komentar... (Gunakan @ untuk mention orang dalam project)" value={commentText} onChange={handleCommentChange} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }} className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" rows={2} />
                                    <button onClick={submitComment} disabled={submittingComment || !commentText.trim()} className="absolute right-2 bottom-2 p-1.5 text-primary disabled:opacity-40"><Send className="h-4 w-4" /></button>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!pendingUploadFile}
                title="Upload Lampiran?"
                message={`Apakah Anda yakin ingin mengupload file "${pendingUploadFile?.name}"?`}
                onConfirm={confirmUpload}
                onCancel={() => setPendingUploadFile(null)}
                confirmText="Ya, Upload"
                cancelText="Batal"
                type="primary"
            />
        </>
    );
}