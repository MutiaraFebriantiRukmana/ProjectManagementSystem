import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Project, PaginatedResponse } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  Calendar,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface IndexProps {
  projects: PaginatedResponse<Project>;
  filters: {
    search: string;
    status: string;
  };
}

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotColor: string }
> = {
  planning: {
    label: 'Planning',
    badgeClass: 'badge-planning',
    dotColor: 'bg-indigo-400',
  },
  active: {
    label: 'Active',
    badgeClass: 'badge-active',
    dotColor: 'bg-emerald-400',
  },
  on_hold: {
    label: 'On Hold',
    badgeClass: 'badge-on_hold',
    dotColor: 'bg-amber-400',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'badge-completed',
    dotColor: 'bg-cyan-400',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'badge-cancelled',
    dotColor: 'bg-red-400',
  },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ─── Deadline helper ────────────────────────────────────────────────────────
function getDeadlineInfo(endDate: string) {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)} hari terlambat`,
      colorClass: 'deadline-over',
      icon: AlertTriangle,
    };
  }
  if (diffDays <= 7) {
    return {
      label: `${diffDays} hari lagi`,
      colorClass: 'deadline-warn',
      icon: Clock,
    };
  }
  return {
    label: `${diffDays} hari lagi`,
    colorClass: 'deadline-ok',
    icon: Calendar,
  };
}

// ─── Project Card ────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  canEdit,
  canDelete,
  onDelete,
}: {
  project: Project;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: number, name: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
  const deadline = project.end_date ? getDeadlineInfo(project.end_date) : null;
  const DeadlineIcon = deadline?.icon ?? Calendar;
  const members = project.members ?? [];
  const maxAvatars = 3;

  return (
    <div className="glass-card p-8 flex flex-col gap-4 hover:border-border-light transition-all duration-300 group relative">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
            {status.label}
          </span>
          <h3 className="mt-3 text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Action menu */}
        {(canEdit || canDelete) && (
          <div className="relative shrink-0">
            <button
              id={`project-menu-${project.id}`}
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border bg-surface-2 py-1 shadow-xl">
                  {canEdit && (
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface-3 transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-primary" />
                      Edit Project
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(project.id, project.name);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Project
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {/* Manager */}
        {project.manager && (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-project-manager/20 border border-project-manager/30 flex items-center justify-center text-project-manager font-bold text-[10px]">
              {project.manager.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-muted-foreground">{project.manager.username}</span>
          </div>
        )}

        {/* Deadline */}
        {deadline && (
          <div className={`flex items-center gap-1 ${deadline.colorClass}`}>
            <DeadlineIcon className="h-3.5 w-3.5" />
            <span>{deadline.label}</span>
          </div>
        )}
      </div>

      {/* Member avatars */}
      {members.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, maxAvatars).map((m) => (
              <div
                key={m.id}
                title={m.username}
                className="h-7 w-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-xs font-bold text-foreground"
              >
                {m.username?.charAt(0).toUpperCase()}
              </div>
            ))}
            {members.length > maxAvatars && (
              <div className="h-7 w-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-[10px] font-bold text-muted">
                +{members.length - maxAvatars}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {members.length} anggota
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-2 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {project.start_date
            ? new Date(project.start_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
        <Link
          id={`open-project-${project.id}`}
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Buka Project
        </Link>
      </div>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
function Pagination({ data }: { data: PaginatedResponse<Project> }) {
  if (data.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted">
        Menampilkan{' '}
        <span className="font-medium text-foreground">{data.from ?? 0}</span>
        {' – '}
        <span className="font-medium text-foreground">{data.to ?? 0}</span>
        {' dari '}
        <span className="font-medium text-foreground">{data.total}</span> project
      </p>
      <div className="flex items-center gap-1">
        {data.links.map((link, i) => {
          if (link.label === '&laquo; Previous') {
            return (
              <Link
                key={i}
                href={link.url ?? '#'}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  link.url
                    ? 'text-muted hover:bg-surface-2 hover:text-foreground'
                    : 'text-surface-3 cursor-not-allowed pointer-events-none'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            );
          }
          if (link.label === 'Next &raquo;') {
            return (
              <Link
                key={i}
                href={link.url ?? '#'}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  link.url
                    ? 'text-muted hover:bg-surface-2 hover:text-foreground'
                    : 'text-surface-3 cursor-not-allowed pointer-events-none'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            );
          }
          return (
            <Link
              key={i}
              href={link.url ?? '#'}
              className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                link.active
                  ? 'bg-primary text-white'
                  : link.url
                  ? 'text-muted hover:bg-surface-2 hover:text-foreground'
                  : 'text-surface-3 cursor-not-allowed pointer-events-none'
              }`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({
  hasFilters,
  canCreate,
}: {
  hasFilters: boolean;
  canCreate: boolean;
}) {
  return (
    <div className="glass-card p-16 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 border border-border">
        <FolderOpen className="h-8 w-8 text-muted" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">
          {hasFilters ? 'Tidak ada project yang cocok' : 'Belum ada project'}
        </h3>
        <p className="mt-1 text-sm text-muted max-w-xs">
          {hasFilters
            ? 'Coba ubah kata kunci pencarian atau filter status yang Anda gunakan.'
            : canCreate
            ? 'Mulai dengan membuat project pertama Anda.'
            : 'Anda belum ditambahkan ke project apapun.'}
        </p>
      </div>
      {!hasFilters && canCreate && (
        <Link
          href="/projects/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          Buat Project Baru
        </Link>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Index({ projects, filters }: IndexProps) {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  const role = user?.roles?.[0] ?? '';
  const permissions = user?.permissions ?? [];

  const canCreate =
    permissions.includes('projects.create') ||
    role === 'super_admin' ||
    role === 'Super Admin' ||
    role === 'project_manager' ||
    role === 'Project Manager';

  const canDelete =
    role === 'super_admin' || role === 'Super Admin';

  const canEditProject = (project: Project) =>
    role === 'super_admin' ||
    role === 'Super Admin' ||
    project.manager_id === user?.id;

  // ── Search + filter state ────────────────────────────────────────────
  const [search, setSearch] = useState(filters.search ?? '');
  const [status, setStatus] = useState(filters.status ?? '');

  // Debounced search — 400 ms delay (Brief Poin 16, Note #3)
  const doSearch = useCallback(
    (q: string, s: string) => {
      router.get(
        '/projects',
        { search: q, status: s },
        { preserveState: true, replace: true },
      );
    },
    [],
  );

  // Debounce effect for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(search, status);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Status filter fires immediately
  const handleStatusChange = (val: string) => {
    setStatus(val);
    doSearch(search, val);
  };

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleDelete = (id: number, name: string) =>
    setDeleteTarget({ id, name });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    router.delete(`/projects/${deleteTarget.id}`, {
      onFinish: () => setDeleteTarget(null),
    });
  };

  const hasFilters = !!(search || status);

  return (
    <AuthenticatedLayout header="Daftar Project">
      <Head title="Daftar Project" />

      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Daftar Project
            </h2>
            <p className="mt-1 text-sm text-muted">
              Kelola seluruh project yang Anda miliki atau ikuti.
            </p>
          </div>
          {canCreate && (
            <Link
              id="btn-create-project"
              href="/projects/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Buat Project Baru
            </Link>
          )}
        </div>

        {/* ── Flash messages ──────────────────────────────────────────── */}
        <FlashMessages />

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="glass-card p-4 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="search-projects"
              type="text"
              placeholder="Cari nama project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              id="filter-status"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none rounded-xl border border-border bg-surface-1 py-2.5 pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface-2">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats summary */}
          <div className="flex items-center gap-4 px-3 text-xs text-muted border-l border-border">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-foreground">
                  {projects.total}
                </span>{' '}
                project
              </span>
            </div>
          </div>
        </div>

        {/* ── Project Grid ─────────────────────────────────────────────── */}
        {projects.data.length === 0 ? (
          <EmptyState hasFilters={hasFilters} canCreate={canCreate} />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {projects.data.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  canEdit={canEditProject(project)}
                  canDelete={canDelete}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* ── Pagination ─────────────────────────────────────────── */}
            <Pagination data={projects} />
          </>
        )}
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AuthenticatedLayout>
  );
}

// ─── Delete Modal ────────────────────────────────────────────────────────────
function DeleteModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error/10 border border-error/20">
            <Trash2 className="h-6 w-6 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Hapus Project?</h3>
            <p className="text-sm text-muted">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <p className="text-sm text-muted mb-6">
          Anda akan menghapus project{' '}
          <span className="font-semibold text-foreground">"{name}"</span>.
          Semua data terkait akan ikut terhapus.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface-2 transition-colors"
          >
            Batal
          </button>
          <button
            id="confirm-delete-project"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-error py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Flash Messages ──────────────────────────────────────────────────────────
function FlashMessages() {
  const { flash } = usePage<PageProps>().props;
  if (!flash?.success && !flash?.error) return null;
  return (
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
  );
}
