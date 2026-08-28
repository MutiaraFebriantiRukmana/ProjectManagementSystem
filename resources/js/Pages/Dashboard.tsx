import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  FileText,
  ShieldAlert,
  FolderKanban,
  KanbanSquare
} from 'lucide-react';

export default function Dashboard() {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  const role = user?.roles?.[0] || 'member';

  const StatCard = ({ title, value, icon: Icon, description, trend, colorClass }: any) => (
    <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
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

  return (
    <AuthenticatedLayout header="Dashboard Monitoring">
      <Head title="Dashboard" />

      {/* Role: Super Admin */}
      {(role === 'super_admin' || role === 'Super Admin') && (
        <div className="space-y-8">
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-super-admin">
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
            <StatCard title="Total Pengguna" value="4" icon={Users} description="User default aktif" trend="+100%" colorClass="text-super-admin border-super-admin/20 bg-super-admin/10" />
            <StatCard title="Aktif Project" value="2" icon={Briefcase} description="Project berjalan" colorClass="text-primary border-primary/20 bg-primary/10" />
            <StatCard title="Audit Logs" value="15" icon={FileText} description="Log terekam" colorClass="text-warning border-warning/20 bg-warning/10" />
            <StatCard title="Sistem Status" value="99.9%" icon={CheckCircle2} description="Uptime server" colorClass="text-success border-success/20 bg-success/10" />
          </div>
        </div>
      )}

      {/* Role: Project Manager */}
      {(role === 'project_manager' || role === 'Project Manager') && (
        <div className="space-y-8">
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-project-manager">
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
            <StatCard title="Project Diampu" value="3" icon={Briefcase} description="Project aktif Anda" colorClass="text-project-manager border-project-manager/20 bg-project-manager/10" />
            <StatCard title="Total Anggota" value="8" icon={Users} description="Developer di tim" colorClass="text-primary border-primary/20 bg-primary/10" />
            <StatCard title="Task Pending" value="5" icon={Clock} description="Menunggu approval" colorClass="text-warning border-warning/20 bg-warning/10" />
            <StatCard title="Task Selesai" value="18" icon={CheckCircle2} description="Bulan ini" trend="+15%" colorClass="text-success border-success/20 bg-success/10" />
          </div>
        </div>
      )}

      {/* Role: Member / Lainnya */}
      {(role !== 'super_admin' && role !== 'Super Admin' && role !== 'project_manager' && role !== 'Project Manager') && (
        <div className="space-y-8">
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-member">
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
            <StatCard title="Project Diikuti" value="2" icon={Briefcase} description="Project aktif" colorClass="text-member border-member/20 bg-member/10" />
            <StatCard title="Task Saya" value="4" icon={Clock} description="Perlu dikerjakan" colorClass="text-warning border-warning/20 bg-warning/10" />
            <StatCard title="In Progress" value="1" icon={TrendingUp} description="Sedang berjalan" colorClass="text-primary border-primary/20 bg-primary/10" />
            <StatCard title="Selesai" value="9" icon={CheckCircle2} description="Tervalidasi" colorClass="text-success border-success/20 bg-success/10" />
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}