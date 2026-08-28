import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldAlert,
  FolderKanban,
  KanbanSquare,
  Folder,
  Calendar,
  ChevronRight,
  Filter,
  FolderOpen,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface Stats {
  total_users?: number;
  total_projects?: number;
  active_projects?: number;
  audit_logs_count?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  in_progress_tasks?: number;
}

interface DashboardProject {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  manager?: { username: string };
}

interface DashboardProps {
  stats?: Stats;
  projects?: DashboardProject[];
  filters?: { status: string };
}

// ─── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; dotColor: string }> = {
  planning:  { label: 'Planning',   badgeClass: 'badge-planning',  dotColor: 'bg-indigo-400' },
  active:    { label: 'Active',     badgeClass: 'badge-active',    dotColor: 'bg-emerald-400' },
  on_hold:   { label: 'On Hold',    badgeClass: 'badge-on_hold',   dotColor: 'bg-amber-400' },
  completed: { label: 'Completed',  badgeClass: 'badge-completed', dotColor: 'bg-cyan-400' },
  cancelled: { label: 'Cancelled',  badgeClass: 'badge-cancelled', dotColor: 'bg-red-400' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '',          label: 'Semua Status' },
  { value: 'planning',  label: 'Planning' },
  { value: 'active',    label: 'Active' },
  { value: 'on_hold',   label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ─── Date formatter ────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  trend?: string;
  colorClass: string;
}) {
  return (
    <div className="glass-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{description}</span>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-success">
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Project Table ──────────────────────────────────────────────────────────
function ProjectTable({
  projects,
  filters,
  accentClass,
}: {
  projects: DashboardProject[];
  filters: { status: string };
  accentClass: string;
}) {
  const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    router.get('/dashboard', { status: val }, { preserveState: true, replace: true });
  };

  const handleRowClick = (id: number) => {
    router.visit(`/projects/${id}`);
  };

  return (
    <div className="glass-card">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className={`h-4 w-4 ${accentClass}`} />
          <h3 className="text-sm font-semibold text-foreground">
            Project Saya
          </h3>
          <span className="ml-1 rounded-full bg-surface-2 border border-border px-2 py-0.5 text-xs font-medium text-muted">
            {projects.length}
          </span>
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            id="dashboard-status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-surface-2 py-2 pl-8 pr-6 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface-2">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 border border-border">
            <FolderOpen className="h-7 w-7 text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Tidak ada project</p>
            <p className="mt-1 text-xs text-muted">
              {statusFilter
                ? 'Tidak ada project yang cocok dengan filter ini.'
                : 'Belum ada project yang ditugaskan kepada Anda.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nama Project
                </th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mulai
                </th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Deadline
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => {
                const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
                return (
                  <tr
                    key={project.id}
                    onClick={() => handleRowClick(project.id)}
                    className="cursor-pointer hover:bg-white/5 transition-colors duration-150 group"
                  >
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-border group-hover:border-primary/30 transition-colors">
                          <Briefcase className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                            {project.name}
                          </p>
                          {project.manager && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              PM: {project.manager.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Start date */}
                    <td className="hidden sm:table-cell px-5 py-4">
                      <div className="flex items-center gap-1.5 text-muted">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm">{formatDate(project.start_date)}</span>
                      </div>
                    </td>

                    {/* End date */}
                    <td className="hidden sm:table-cell px-5 py-4">
                      <div className="flex items-center gap-1.5 text-muted">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm">{formatDate(project.end_date)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusCfg.badgeClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Dashboard({ stats, projects = [], filters = { status: '' } }: DashboardProps) {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  const role = user?.roles?.[0] || 'member';

  const isSuperAdmin   = role === 'super_admin' || role === 'Super Admin';
  const isProjectMgr   = role === 'project_manager' || role === 'Project Manager';
  const isMember       = !isSuperAdmin && !isProjectMgr;

  return (
    <AuthenticatedLayout header="Dashboard Monitoring">
      <Head title="Dashboard" />

      {/* ── Super Admin ──────────────────────────────────────────────── */}
      {isSuperAdmin && (
        <div className="space-y-8">
          <div className="glass-card p-6 border-l-4 border-super-admin">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-super-admin/10 border border-super-admin/20 text-super-admin">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Welcome Back, Super Admin!</h2>
                <p className="mt-1 text-sm text-muted">
                  Anda memiliki akses penuh untuk mengelola pengguna, memantau infrastruktur data project, dan memverifikasi audit log sistem.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Pengguna"
              value={stats?.total_users ?? 0}
              icon={Users}
              description="User terdaftar di database"
              colorClass="text-super-admin border-super-admin/20 bg-super-admin/10"
            />
            <StatCard
              title="Aktif Project"
              value={stats?.active_projects ?? 0}
              icon={Briefcase}
              description="Project sedang berjalan"
              colorClass="text-primary border-primary/20 bg-primary/10"
            />
            <StatCard
              title="Total Project"
              value={stats?.total_projects ?? 0}
              icon={FolderKanban}
              description="Keseluruhan project"
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
            <StatCard
              title="Sistem Status"
              value="Online"
              icon={CheckCircle2}
              description="Database & Server operasional"
              colorClass="text-success border-success/20 bg-success/10"
            />
          </div>
        </div>
      )}

      {/* ── Project Manager ──────────────────────────────────────────── */}
      {isProjectMgr && (
        <div className="space-y-8">
          <div className="glass-card p-6 border-l-4 border-project-manager">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-project-manager/10 border border-project-manager/20 text-project-manager">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Halo, Project Manager!</h2>
                <p className="mt-1 text-sm text-muted">
                  Kelola siklus hidup project, delegasikan task, dan pantau milestone tim Anda secara real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Project Aktif"
              value={stats?.active_projects ?? 0}
              icon={Briefcase}
              description="Project aktif di bawah manajemen"
              colorClass="text-project-manager border-project-manager/20 bg-project-manager/10"
            />
            <StatCard
              title="Total Project"
              value={projects.length}
              icon={FolderKanban}
              description="Project yang Anda kelola"
              colorClass="text-primary border-primary/20 bg-primary/10"
            />
            <StatCard
              title="Task Pending"
              value={stats?.pending_tasks ?? 0}
              icon={Clock}
              description="Menunggu approval / review"
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
            <StatCard
              title="Task Selesai"
              value={stats?.completed_tasks ?? 0}
              icon={CheckCircle2}
              description="Task terverifikasi done"
              colorClass="text-success border-success/20 bg-success/10"
            />
          </div>

          {/* Project Table */}
          <ProjectTable
            projects={projects}
            filters={filters}
            accentClass="text-project-manager"
          />
        </div>
      )}

      {/* ── Member ───────────────────────────────────────────────────── */}
      {isMember && (
        <div className="space-y-8">
          <div className="glass-card p-6 border-l-4 border-member">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-member/10 border border-member/20 text-member">
                <KanbanSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Halo, Tim Member!</h2>
                <p className="mt-1 text-sm text-muted">
                  Lihat tugas yang diberikan kepada Anda, update status pengerjaan, dan submit task untuk review.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Project Terdaftar"
              value={projects.length}
              icon={Briefcase}
              description="Project yang dapat Anda akses"
              colorClass="text-member border-member/20 bg-member/10"
            />
            <StatCard
              title="Task Saya"
              value={stats?.pending_tasks ?? 0}
              icon={Clock}
              description="Task yang didelegasikan"
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
            <StatCard
              title="In Progress"
              value={stats?.in_progress_tasks ?? 0}
              icon={TrendingUp}
              description="Sedang dalam pengerjaan"
              colorClass="text-primary border-primary/20 bg-primary/10"
            />
            <StatCard
              title="Selesai"
              value={stats?.completed_tasks ?? 0}
              icon={CheckCircle2}
              description="Task yang telah selesai"
              colorClass="text-success border-success/20 bg-success/10"
            />
          </div>

          {/* Project Table */}
          <ProjectTable
            projects={projects}
            filters={filters}
            accentClass="text-member"
          />
        </div>
      )}
    </AuthenticatedLayout>
  );
}