import React, { useState, useRef, useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
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

    // Editing assignee state
    const [editingAssignees, setEditingAssignees] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<number[]>((initialTask.assignees ?? []).map(a => a.id));
    const [updatingAssignees, setUpdatingAssignees] = useState(false);

    // Confirm upload state
    const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);

    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploadProcessing, progress, reset: resetUpload } = useForm({ file: null as File | null });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    // Ambil role secara aman (Object vs String)
    const rawRole = currentUser?.roles?.[0];
    const roleName = typeof rawRole === 'object' ? rawRole?.name : (rawRole || 'member');

    const isSuperAdmin = roleName === 'super_admin';
    const isProjectManager = currentUser.id === projectManagerId;
    const isCanApprove = isSuperAdmin || isProjectManager;
    const isAssignee = (task.assignees ?? []).some((a) => a.id === currentUser.id);
    const { auth } = usePage<any>().props;
    const isCanDelete = hasPermission(auth, 'tasks.delete') || isProjectManager;
    const canEditTask = hasPermission(auth, 'tasks.edit') || isProjectManager;

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

    const deleteComment = (commentId: number) => {
        const snap = [...comments];
        setComments((prev) => prev.filter((c) => c.id !== commentId));
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

    const submitForReview = () => changeStatus('review');
    const approveTask     = () => changeStatus('done');
    const requestRevision = () => changeStatus('in_progress');

    const completedSubtasks = subtasks.filter((s) => s.status === 'done').length;
    const blockedDeps = (task.dependencies ?? []).filter((d) => d.status !== 'done');

    const saveAssignees = () => {
        if (updatingAssignees) return;
        setUpdatingAssignees(true);
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
                            
                            {/* Status */}
                            <section>
                                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(STATUS_LABELS) as Task['status'][]).map((s) => (
                                        <button key={s} onClick={() => changeStatus(s)} disabled={togglingStatus} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${task.status === s ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-muted hover:bg-surface-2 hover:text-foreground'}`}>
                                            {STATUS_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
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
                                            <button onClick={saveAssignees} disabled={updatingAssignees} className="mt-2 w-full rounded-lg bg-primary/10 border border-primary/20 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
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
                                                <button onClick={() => deleteComment(c.id)} className="p-1.5 rounded-lg text-muted hover:text-error transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
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