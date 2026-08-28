import React, { useState } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Project, User } from '@/types';
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
} from 'lucide-react';

interface ShowProps {
  project: Project;
  available_members: User[];
}

// ─── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  planning:  { label: 'Planning',   badgeClass: 'badge-planning' },
  active:    { label: 'Active',     badgeClass: 'badge-active' },
  on_hold:   { label: 'On Hold',    badgeClass: 'badge-on_hold' },
  completed: { label: 'Completed',  badgeClass: 'badge-completed' },
  cancelled: { label: 'Cancelled',  badgeClass: 'badge-cancelled' },
};

// ─── Deadline helper ──────────────────────────────────────────────────────
function getDeadlineInfo(endDate: string) {
  const now      = new Date();
  const end      = new Date(endDate);
  const diffMs   = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)} hari terlambat`, colorClass: 'deadline-over', Icon: AlertTriangle };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays} hari lagi`, colorClass: 'deadline-warn', Icon: Clock };
  }
  return { label: `${diffDays} hari lagi`, colorClass: 'deadline-ok', Icon: Calendar };
}

// ─── Add Member Modal ─────────────────────────────────────────────────────
function AddMemberModal({
  project,
  allUsers,
  onClose,
}: {
  project: Project;
  allUsers: User[];
  onClose: () => void;
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    user_id: '',
  });

  // Filter out users already in the project (members + manager)
  const memberIds = new Set([
    project.manager_id,
    ...(project.members ?? []).map((m) => m.id),
  ]);
  const available = allUsers.filter((u) => !memberIds.has(u.id));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/projects/${project.id}/members`, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
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
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {available.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Semua user sudah menjadi anggota project ini.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="add-member-select" className="block text-sm font-medium text-foreground">
                Pilih User
              </label>
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
                    {u.username} {u.roles && u.roles.length > 0 ? `(${u.roles[0].name})` : ''} — {u.email}
                  </option>
                ))}
              </select>
              {errors.user_id && (
                <p className="text-xs text-error">{errors.user_id}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface-2 transition-colors"
              >
                Batal
              </button>
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
    </div>
  );
}

// ─── Remove Member Confirmation ───────────────────────────────────────────
function RemoveMemberModal({
  member,
  projectId,
  onClose,
}: {
  member: User;
  projectId: number;
  onClose: () => void;
}) {
  const [processing, setProcessing] = useState(false);

  const confirm = () => {
    setProcessing(true);
    router.delete(`/projects/${projectId}/members/${member.id}`, {
      onFinish: () => {
        setProcessing(false);
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error/10 border border-error/20">
            <UserMinus className="h-6 w-6 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Hapus Anggota?</h3>
            <p className="text-sm text-muted">Tindakan ini dapat dibatalkan dengan menambah ulang.</p>
          </div>
        </div>
        <p className="text-sm text-muted mb-6">
          Anda akan menghapus{' '}
          <span className="font-semibold text-foreground">{member.username}</span>{' '}
          dari project ini.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface-2 transition-colors"
          >
            Batal
          </button>
          <button
            id={`confirm-remove-member-${member.id}`}
            onClick={confirm}
            disabled={processing}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-error py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────
type Tab = 'overview' | 'kanban' | 'files';

// ─── Main Page ────────────────────────────────────────────────────────────
export default function Show({ project, available_members }: ShowProps) {
  const { auth } = usePage<PageProps>().props;
  const { flash } = usePage<PageProps>().props;
  const user   = auth.user;
  const role   = user?.roles?.[0] ?? '';

  const isSuperAdmin   = role === 'super_admin' || role === 'Super Admin';
  const isManager      = project.manager_id === user?.id;
  const canManageMembers = isSuperAdmin || isManager;
  const canEdit        = isSuperAdmin || isManager;

  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
  const deadline = project.end_date ? getDeadlineInfo(project.end_date) : null;
  const members = project.members ?? [];

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [removingMember, setRemovingMember] = useState<User | null>(null);

  const tabs = [
    { key: 'overview' as Tab, label: 'Overview',        Icon: LayoutList },
    { key: 'kanban'   as Tab, label: 'Board Kanban',    Icon: KanbanSquare },
    { key: 'files'    as Tab, label: 'Files / Attachments', Icon: Paperclip },
  ];

  return (
    <AuthenticatedLayout header={project.name}>
      <Head title={project.name} />

      <div className="space-y-6">
        {/* ── Flash messages ─────────────────────────────────────────── */}
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

        {/* ── Breadcrumb ─────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-xs">
            {project.name}
          </span>
        </nav>

        {/* ── Project Header Card ────────────────────────────────────── */}
        <div className="glass-card p-6 space-y-5">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
                  {status.label}
                </span>
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
                    ? new Date(project.start_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })
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
                    ? new Date(project.end_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })
                    : '—'}
                </span>
              </span>
            </div>
          </div>

          {/* Manager card */}
          {project.manager && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-2 border border-border px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-project-manager/10 border border-project-manager/20 text-project-manager font-bold">
                {project.manager.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {project.manager.username}
                  </span>
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
        </div>

        {/* ── Tab Bar ───────────────────────────────────────────────── */}
        <div className="flex border-b border-border">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-primary bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary))] bg-[length:100%_2px] bg-no-repeat bg-bottom'
                  : 'text-muted hover:text-foreground border-b-2 border-transparent hover:border-border-light'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────── */}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="glass-card p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted" />
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
                  Deskripsi Project
                </h2>
              </div>
              {project.description ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Belum ada deskripsi untuk project ini.
                </p>
              )}
            </div>

            {/* Member Management */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted" />
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
                    Anggota Tim Project ({members.length})
                  </h2>
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
                <div className="divide-y divide-border">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-member/10 border border-member/20 flex items-center justify-center text-sm font-bold text-member">
                          {member.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {member.username}
                          </p>
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
              )}
            </div>
          </div>
        )}

        {/* Kanban Tab — Placeholder */}
        {activeTab === 'kanban' && (
          <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-project-manager/10 border border-project-manager/20">
              <KanbanSquare className="h-8 w-8 text-project-manager" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Board Kanban</h3>
              <p className="mt-2 text-sm text-muted max-w-sm">
                Modul Task Management &amp; Kanban Board akan aktif pada{' '}
                <span className="font-semibold text-project-manager">
                  Milestone Hari 3/4
                </span>
                . Pantau terus progress project ini di sini.
              </p>
            </div>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/20 px-3 py-1 text-xs font-semibold text-warning">
              <Clock className="h-3 w-3" />
              Coming soon — Day 3/4
            </span>
          </div>
        )}

        {/* Files Tab — Placeholder */}
        {activeTab === 'files' && (
          <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Paperclip className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Files &amp; Attachments</h3>
              <p className="mt-2 text-sm text-muted max-w-sm">
                Modul manajemen file dan lampiran tugas akan tersedia saat modul Task
                diaktifkan pada{' '}
                <span className="font-semibold text-primary">Milestone Hari 3/4</span>.
              </p>
            </div>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/20 px-3 py-1 text-xs font-semibold text-warning">
              <Clock className="h-3 w-3" />
              Coming soon — Day 3/4
            </span>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
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
    </AuthenticatedLayout>
  );
}