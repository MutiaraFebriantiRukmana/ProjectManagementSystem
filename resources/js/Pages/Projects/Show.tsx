import React, { useState } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Project, Task, Label, User } from '@/types';
import KanbanBoard from '@/Components/Tasks/KanbanBoard';
import TaskDetailModal from '@/Components/Tasks/TaskDetailModal';
import CreateTaskModal from '@/Components/Tasks/CreateTaskModal';
import {
    ChevronRight,
    Calendar,
    Users,
    UserPlus,
    UserMinus,
    Edit2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    KanbanSquare,
    Paperclip,
    LayoutList,
    X,
    Loader2,
    Mail,
    ShieldCheck,
    Briefcase,
    Plus,
    TrendingUp,
    FileText,
    FileImage,
    File,
    Download,
    FolderOpen,
    LayoutTemplate,
} from 'lucide-react';
import { hasPermission } from '@/utils/permissions';
import ConfirmModal from '@/Components/ConfirmModal';

// ─── Props interface ───────────────────────────────────────────────────────────
interface ShowProps {
    project: Project;
    available_members: User[];
    labels: Label[];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
    planning:  { label: 'Planning',   badgeClass: 'badge-planning' },
    active:    { label: 'Active',     badgeClass: 'badge-active' },
    on_hold:   { label: 'On Hold',    badgeClass: 'badge-on_hold' },
    completed: { label: 'Completed',  badgeClass: 'badge-completed' },
    cancelled: { label: 'Cancelled',  badgeClass: 'badge-cancelled' },
};

// ─── Deadline helper ──────────────────────────────────────────────────────────
function getDeadlineInfo(endDate: string) {
    const now      = new Date();
    const end      = new Date(endDate);
    const diffMs   = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0)   return { label: `${Math.abs(diffDays)} hari terlambat`, colorClass: 'deadline-over', Icon: AlertTriangle };
    if (diffDays <= 7)  return { label: `${diffDays} hari lagi`, colorClass: 'deadline-warn', Icon: Clock };
    return { label: `${diffDays} hari lagi`, colorClass: 'deadline-ok', Icon: Calendar };
}

// ─── File icon helper ─────────────────────────────────────────────────────────
function getFileIcon(filetype: string) {
    if (filetype?.startsWith('image/')) return <FileImage className="h-8 w-8 text-blue-400" />;
    if (filetype === 'application/pdf') return <FileText className="h-8 w-8 text-red-400" />;
    return <File className="h-8 w-8 text-muted" />;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({
    project,
    allUsers,
    onClose,
}: {
    project: Project;
    allUsers: User[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({ user_id: '' });

    const memberIds = new Set([
        project.manager_id,
        ...(project.members ?? []).map((m) => m.id),
    ]);
    const available = allUsers.filter((u) => !memberIds.has(u.id));

    const [confirmAdd, setConfirmAdd] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmAdd(true);
    };

    const handleConfirmSubmit = () => {
        post(`/projects/${project.id}/members`, {
            onSuccess: () => { reset(); onClose(); setConfirmAdd(false); },
            onError: () => setConfirmAdd(false),
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card p-8 w-full max-w-md shadow-2xl relative z-[110]">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Tambah Anggota</h3>
                            <p className="text-xs text-muted">Pilih user untuk ditambahkan ke project ini</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {available.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">Semua user sudah menjadi anggota project ini.</p>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="add-member-select" className="block text-sm font-medium text-foreground">Pilih User</label>
                            <select
                                id="add-member-select"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                                required
                                className="w-full rounded-xl border border-border bg-surface-1 py-2.5 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                <option value="" className="bg-surface-2">-- Pilih user --</option>
                                {available.map((u) => (
                                    <option key={u.id} value={u.id} className="bg-surface-2">
                                        {u.username} {u.roles && u.roles.length > 0 ? `(${u.roles[0].name ?? u.roles[0]})` : ''} — {u.email}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <p className="text-xs text-error">{errors.user_id}</p>}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface-2 transition-colors">Batal</button>
                            <button
                                type="submit"
                                id="confirm-add-member"
                                disabled={processing || !data.user_id}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition-all"
                            >
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                Tambah
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            <ConfirmModal
                isOpen={confirmAdd}
                title="Konfirmasi Tambah Anggota"
                message="Apakah Anda yakin ingin menambahkan user ini ke dalam project?"
                onConfirm={handleConfirmSubmit}
                onCancel={() => setConfirmAdd(false)}
                confirmText="Ya, Tambahkan"
                cancelText="Batal"
                type="primary"
            />
        </div>
    );
}

// ─── Remove Member Modal ──────────────────────────────────────────────────────
function RemoveMemberModal({
    member,
    projectId,
    onClose,
}: {
    member: User;
    projectId: number;
    onClose: () => void;
}) {
    const confirm = () => {
        router.delete(`/projects/${projectId}/members/${member.id}`, {
            onFinish: () => { onClose(); },
            preserveScroll: true
        });
    };

    return (
        <ConfirmModal
            isOpen={true}
            title="Hapus Anggota?"
            message={`Anda akan menghapus ${member.username} dari project ini. Tindakan ini dapat dibatalkan dengan menambah ulang.`}
            confirmText="Ya, Hapus"
            cancelText="Batal"
            type="danger"
            onConfirm={confirm}
            onCancel={onClose}
        />
    );
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'kanban' | 'files';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Show({ project, available_members, labels }: ShowProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const user   = auth.user;
    const role   = user?.roles?.[0] ?? '';
    const roleName = typeof role === 'string' ? role : (role as any)?.name ?? '';

    const isSuperAdmin     = roleName === 'super_admin' || roleName === 'Super Admin';
    const isManager        = project.manager_id === user?.id;
    const canManageMembers = isSuperAdmin || isManager;
    const canEdit          = isSuperAdmin || isManager;
    const canCreateTask    = hasPermission(auth, 'tasks.create') || isManager;

    const status   = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
    const deadline = project.end_date ? getDeadlineInfo(project.end_date) : null;
    const members  = project.members ?? [];
    const tasks    = project.tasks ?? [];

    // Progress
    const totalTasks     = tasks.filter((t) => !t.parent_id).length;
    const doneTasks      = tasks.filter((t) => !t.parent_id && t.status === 'done').length;
    const progressPct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // All attachments from all tasks
    const allAttachments = tasks.flatMap((t) =>
        (t.attachments ?? []).map((a) => ({ ...a, taskTitle: t.title }))
    );

    // Segment members
    const clientMembers = members.filter(m => {
        const r = m.roles?.[0] ?? '';
        const rName = typeof r === 'string' ? r : (r as any)?.name ?? '';
        return rName === 'client' || rName === 'Viewer / Client' || rName === 'viewer';
    });

    const internalMembers = members.filter(m => !clientMembers.includes(m));

    const [activeTab, setActiveTab]         = useState<Tab>('kanban');
    const [showAddModal, setShowAddModal]   = useState(false);
    const [removingMember, setRemovingMember] = useState<User | null>(null);
    const [selectedTask, setSelectedTask]   = useState<Task | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState<string | null>(null);

    const tabs = [
        { key: 'kanban'   as Tab, label: 'Board Kanban',        Icon: KanbanSquare },
        { key: 'overview' as Tab, label: 'Anggota Tim',          Icon: Users },
        { key: 'files'    as Tab, label: 'File Lampiran',        Icon: Paperclip },
    ];

    // When a task is updated on the detail modal, we need to trigger page reload
    // to get fresh server state. Inertia's router.reload handles this gracefully.
    const handleTaskUpdate = (updatedTask: Task) => {
        // For subtask adds that use router.post, Inertia will auto-refresh props.
        // No manual state merge needed since Inertia refreshes the page props.
    };

    const confirmStatusChange = () => {
        if (!statusConfirm) return;
        router.patch(
            `/projects/${project.id}`,
            { status: statusConfirm },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setStatusConfirm(null),
                onError: () => setStatusConfirm(null),
            }
        );
    };

    return (
        <AuthenticatedLayout header={project.name}>
            <Head title={project.name} />

            <div className="space-y-6">
                {/* ── Flash messages ───────────────────────────────────────── */}
                {(flash?.success || flash?.error) && (
                    <div>
                        {flash.success && (
                            <div className="flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
                                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                                <p className="text-sm text-success">{flash.success}</p>
                            </div>
                        )}
                        {flash.error && (
                            <div className="flex items-center gap-3 rounded-xl bg-error/10 border border-error/20 px-4 py-3">
                                <AlertTriangle className="h-5 w-5 text-error shrink-0" />
                                <p className="text-sm text-error">{flash.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Breadcrumb ────────────────────────────────────────────── */}
                <nav className="flex items-center gap-2 text-sm text-muted">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground font-medium truncate max-w-xs">{project.name}</span>
                </nav>

                {/* ── Project Header Card ───────────────────────────────────── */}
                <div className="glass-card p-8 space-y-5">
                    {/* Title row */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                {canEdit ? (
                                    <select
                                        value={project.status}
                                        onChange={(e) => setStatusConfirm(e.target.value)}
                                        className={`appearance-none cursor-pointer rounded-full px-3 py-1 pl-4 pr-6 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 ${status.badgeClass} border border-transparent`}
                                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.2rem center', backgroundSize: '1em' }}
                                    >
                                        <option value="planning" className="bg-surface-2 text-foreground">Planning</option>
                                        <option value="active" className="bg-surface-2 text-foreground">Active</option>
                                        <option value="on_hold" className="bg-surface-2 text-foreground">On Hold</option>
                                        <option value="completed" className="bg-surface-2 text-foreground">Completed</option>
                                        <option value="cancelled" className="bg-surface-2 text-foreground">Cancelled</option>
                                    </select>
                                ) : (
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
                                        {status.label}
                                    </span>
                                )}
                                {deadline && (
                                    <span className={`inline-flex items-center gap-1 text-xs ${deadline.colorClass}`}>
                                        <deadline.Icon className="h-3.5 w-3.5" />
                                        {deadline.label}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                        </div>
                        {canEdit && (
                            <Link
                                id="btn-edit-project"
                                href={`/projects/${project.id}/edit`}
                                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit Project
                            </Link>
                        )}
                    </div>

                    {/* Date meta */}
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Start:{' '}
                                <span className="text-foreground font-medium">
                                    {project.start_date
                                        ? new Date(project.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '—'}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted">
                            <Clock className="h-4 w-4" />
                            <span>
                                Deadline:{' '}
                                <span className={`font-medium ${deadline ? deadline.colorClass : 'text-foreground'}`}>
                                    {project.end_date
                                        ? new Date(project.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '—'}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Manager */}
                    {project.manager && (
                        <div className="flex items-center gap-3 rounded-xl bg-surface-2 border border-border px-4 py-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-project-manager/10 border border-project-manager/20 text-project-manager font-bold">
                                {project.manager.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">{project.manager.username}</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-project-manager/10 border border-project-manager/20 px-2 py-0.5 text-[10px] font-semibold text-project-manager">
                                        <ShieldCheck className="h-2.5 w-2.5" />
                                        Project Manager
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                                    <Mail className="h-3 w-3" />
                                    {project.manager.email}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {totalTasks > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1.5 text-muted">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Progress</span>
                                </div>
                                <span className="font-semibold text-foreground">
                                    {doneTasks}/{totalTasks} task selesai ({progressPct}%)
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-700"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tab Bar + Create Task Button ─────────────────────────── */}
                <div className="flex items-center justify-between border-b border-border">
                    <div className="flex">
                        {tabs.map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                id={`tab-${key}`}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                                    activeTab === key
                                        ? 'text-primary border-b-2 border-primary'
                                        : 'text-muted hover:text-foreground border-b-2 border-transparent hover:border-border-light'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Floating "+ Task" button */}
                    {canCreateTask && activeTab === 'kanban' && (
                        <button
                            id="btn-create-task"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all mb-1 mr-1"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Task
                        </button>
                    )}
                </div>

                {/* ── Tab Content ───────────────────────────────────────────── */}

                {/* Kanban Tab */}
                {activeTab === 'kanban' && (
                    <div className="overflow-x-auto pb-2">
                        <KanbanBoard
                            initialTasks={tasks}
                            projectMembers={[
                                ...(project.manager ? [project.manager] : []),
                                ...members,
                            ]}
                            labels={labels}
                            onTaskClick={setSelectedTask}
                        />
                    </div>
                )}

                {/* Overview / Members Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Description */}
                        <div className="glass-card p-8 space-y-3">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted" />
                                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Deskripsi Project</h2>
                            </div>
                            {project.description ? (
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
                            ) : (
                                <p className="text-sm text-muted italic">Belum ada deskripsi untuk project ini.</p>
                            )}
                        </div>

                        {/* Member Management */}
                        <div className="glass-card p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted" />
                                    <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Anggota Tim ({members.length})</h2>
                                </div>
                                {canManageMembers && (
                                    <button
                                        id="btn-add-member"
                                        onClick={() => setShowAddModal(true)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Tambah Anggota
                                    </button>
                                )}
                            </div>

                            {members.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-8 text-center">
                                    <div className="h-12 w-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                                        <Users className="h-6 w-6 text-muted" />
                                    </div>
                                    <p className="text-sm text-muted">Belum ada anggota yang ditambahkan.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {internalMembers.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Tim Internal</h3>
                                            <div className="divide-y divide-border">
                                                {internalMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-member/10 border border-member/20 flex items-center justify-center text-sm font-bold text-member">
                                                                {member.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-foreground">{member.username}</p>
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                                        <ShieldCheck className="h-2.5 w-2.5" />
                                                                        {typeof member.roles?.[0] === 'string' ? member.roles[0].replace('_', ' ') : (member.roles?.[0] as any)?.name?.replace('_', ' ') ?? 'Member'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-muted">
                                                                    <Mail className="h-3 w-3" />
                                                                    {member.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {canManageMembers && (
                                                            <button
                                                                id={`btn-remove-member-${member.id}`}
                                                                onClick={() => setRemovingMember(member)}
                                                                title={`Hapus ${member.username}`}
                                                                className="p-1.5 rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                                                            >
                                                                <UserMinus className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {clientMembers.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-client uppercase tracking-wider mb-3 mt-4">Klien / Viewer</h3>
                                            <div className="divide-y divide-border">
                                                {clientMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-client/10 border border-client/20 flex items-center justify-center text-sm font-bold text-client">
                                                                {member.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-foreground">{member.username}</p>
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                                                                        <ShieldCheck className="h-2.5 w-2.5" />
                                                                        {typeof member.roles?.[0] === 'string' ? member.roles[0].replace('_', ' ') : (member.roles?.[0] as any)?.name?.replace('_', ' ') ?? 'Client'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-muted">
                                                                    <Mail className="h-3 w-3" />
                                                                    {member.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {canManageMembers && (
                                                            <button
                                                                id={`btn-remove-member-${member.id}`}
                                                                onClick={() => setRemovingMember(member)}
                                                                title={`Hapus ${member.username}`}
                                                                className="p-1.5 rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                                                            >
                                                                <UserMinus className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Files Tab */}
                {activeTab === 'files' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-foreground">
                                File Lampiran Project
                                <span className="ml-2 text-sm font-normal text-muted">({allAttachments.length} file)</span>
                            </h2>
                        </div>

                        {allAttachments.length === 0 ? (
                            <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                                    <FolderOpen className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Belum Ada Lampiran</h3>
                                    <p className="mt-1 text-sm text-muted max-w-xs">
                                        Upload file melalui detail task di Board Kanban.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {allAttachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="glass-card p-5 flex flex-col gap-3 hover:border-border-light hover:shadow-[0_0_20px_rgba(252,165,193,0.07)] transition-all"
                                    >
                                        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-surface-2 border border-border mx-auto">
                                            {getFileIcon(att.filetype)}
                                        </div>
                                        <div className="text-center min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate" title={att.filename}>
                                                {att.filename}
                                            </p>
                                            <p className="text-xs text-muted mt-0.5">{formatBytes(att.filesize)}</p>
                                            <p className="text-[10px] text-muted mt-0.5 truncate" title={(att as any).taskTitle}>
                                                Task: {(att as any).taskTitle}
                                            </p>
                                        </div>
                                        <a
                                            href={`/attachments/${att.id}/download`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modals ──────────────────────────────────────────────────────── */}
            {showAddModal && (
                <AddMemberModal
                    project={project}
                    allUsers={available_members}
                    onClose={() => setShowAddModal(false)}
                />
            )}
            {removingMember && (
                <RemoveMemberModal
                    member={removingMember}
                    projectId={project.id}
                    onClose={() => setRemovingMember(null)}
                />
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <CreateTaskModal
                    projectId={project.id}
                    projectTasks={tasks.filter((t) => !t.parent_id)}
                    projectMembers={[
                        ...(project.manager ? [project.manager] : []),
                        ...members,
                    ]}
                    labels={labels}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    currentUser={user}
                    projectManagerId={project.manager_id}
                    allProjectTasks={tasks}
                    projectMembers={[
                        ...(project.manager ? [project.manager] : []),
                        ...members,
                    ]}
                    onClose={() => setSelectedTask(null)}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}

            {/* Confirm Status Modal */}
            <ConfirmModal
                isOpen={!!statusConfirm}
                title="Ubah Status Project"
                message={`Apakah Anda yakin ingin mengubah status project ini menjadi ${
                    statusConfirm ? STATUS_CONFIG[statusConfirm]?.label : ''
                }?`}
                confirmText="Ya, Ubah"
                cancelText="Batal"
                type="primary"
                onConfirm={confirmStatusChange}
                onCancel={() => setStatusConfirm(null)}
            />
        </AuthenticatedLayout>
    );
}