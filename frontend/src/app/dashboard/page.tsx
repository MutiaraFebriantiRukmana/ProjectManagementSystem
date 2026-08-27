'use client';

import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FileText,
  ShieldAlert,
  FolderKanban,
  KanbanSquare
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role.role_name;

  // Stat Card Component helper
  const StatCard = ({ title, value, icon: Icon, description, trend, colorClass }: any) => (
    <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-border-light">
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

  // Render role-specific dashboards
  switch (role) {
    case 'super_admin':
      return (
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Alert */}
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-super-admin">
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-super-admin/10 border border-super-admin/20 text-super-admin">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Welcome Back, Super Admin!</h2>
                <p className="mt-1 text-sm text-muted">
                  Anda memiliki akses penuh untuk mengelola pengguna, memantau infrastruktur data project, dan memverifikasi log sistem.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Pengguna" 
              value="42" 
              icon={Users} 
              description="Aktif di seluruh platform" 
              trend="+12% bulan ini"
              colorClass="text-super-admin border-super-admin/20 bg-super-admin/10"
            />
            <StatCard 
              title="Aktif Project" 
              value="18" 
              icon={Briefcase} 
              description="Project sedang berjalan" 
              colorClass="text-primary border-primary/20 bg-primary/10"
            />
            <StatCard 
              title="Audit Logs" 
              value="1.2k" 
              icon={FileText} 
              description="Log aktivitas terekam" 
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
            <StatCard 
              title="Sistem Status" 
              value="99.9%" 
              icon={CheckCircle2} 
              description="Uptime server utama" 
              colorClass="text-success border-success/20 bg-success/10"
            />
          </div>

          {/* User List Placeholder Table */}
          <div className="glass rounded-2xl overflow-hidden border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Daftar User Default di Database</h3>
              <span className="text-xs text-muted">Seeded data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-1/50 text-xs font-semibold text-muted border-b border-border">
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Password Dummy</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  <tr className="hover:bg-surface-1/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-super-admin">Super Admin</td>
                    <td className="px-6 py-4 text-foreground font-medium">superadmin</td>
                    <td className="px-6 py-4 text-muted">superadmin@pm.test</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted">password123</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">Aktif</span></td>
                  </tr>
                  <tr className="hover:bg-surface-1/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-project-manager">Project Manager</td>
                    <td className="px-6 py-4 text-foreground font-medium">projectmanager</td>
                    <td className="px-6 py-4 text-muted">pm@pm.test</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted">password123</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">Aktif</span></td>
                  </tr>
                  <tr className="hover:bg-surface-1/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-member">Member</td>
                    <td className="px-6 py-4 text-foreground font-medium">member</td>
                    <td className="px-6 py-4 text-muted">member@pm.test</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted">password123</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">Aktif</span></td>
                  </tr>
                  <tr className="hover:bg-surface-1/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-client">Client</td>
                    <td className="px-6 py-4 text-foreground font-medium">client</td>
                    <td className="px-6 py-4 text-muted">client@pm.test</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted">password123</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">Aktif</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

    case 'project_manager':
      return (
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Card */}
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-project-manager">
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-project-manager/10 border border-project-manager/20 text-project-manager">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Halo, Project Manager!</h2>
                <p className="mt-1 text-sm text-muted">
                  Kelola siklus hidup project, buat milestone baru, distribusikan task ke tim, dan setujui delivery project tepat waktu.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Project Diampu" 
              value="5" 
              icon={Briefcase} 
              description="Project aktif di bawah manajemen" 
              colorClass="text-project-manager border-project-manager/20 bg-project-manager/10"
            />
            <StatCard 
              title="Total Anggota Tim" 
              value="12" 
              icon={Users} 
              description="Developer & designer" 
              colorClass="text-primary border-primary/20 bg-primary/10"
            />
            <StatCard 
              title="Task Tertunda" 
              value="8" 
              icon={Clock} 
              description="Butuh review / approval" 
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
            <StatCard 
              title="Task Selesai" 
              value="34" 
              icon={CheckCircle2} 
              description="Dalam 30 hari terakhir" 
              trend="+24%"
              colorClass="text-success border-success/20 bg-success/10"
            />
          </div>

          {/* Project List Placeholder */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-foreground">Project Aktif Saat Ini</h3>
              <button className="rounded-xl bg-project-manager/10 border border-project-manager/20 px-3.5 py-1.5 text-xs font-semibold text-project-manager hover:bg-project-manager/20 transition-all duration-200">
                + Tambah Project
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-1 border border-border hover:border-border-light transition-all duration-200">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Redesign Landing Page Client</h4>
                  <p className="mt-1 text-xs text-muted">Deadline: 15 September 2026 • PIC: Member Team</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Progress: 60%</span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full bg-project-manager rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-1 border border-border hover:border-border-light transition-all duration-200">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Integrasi API Payment Gateway</h4>
                  <p className="mt-1 text-xs text-muted">Deadline: 28 Oktober 2026 • PIC: Backend Developer</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Progress: 35%</span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full bg-project-manager rounded-full" style={{ width: '35%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'member':
      return (
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Card */}
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-member">
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-member/10 border border-member/20 text-member">
                <KanbanSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Halo, Tim Member!</h2>
                <p className="mt-1 text-sm text-muted">
                  Lihat tugas-tugas yang didelegasikan kepada Anda, update status pekerjaan Anda, dan diskusikan progress secara real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Project Diikuti" 
              value="2" 
              icon={Briefcase} 
              description="Project aktif Anda saat ini" 
              colorClass="text-member border-member/20 bg-member/10"
            />
            <StatCard 
              title="Task Saya (To Do)" 
              value="3" 
              icon={Clock} 
              description="Belum mulai dikerjakan" 
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
            <StatCard 
              title="Task Sedang Jalan" 
              value="2" 
              icon={TrendingUp} 
              description="Dalam proses pengerjaan" 
              colorClass="text-primary border-primary/20 bg-primary/10"
            />
            <StatCard 
              title="Task Selesai" 
              value="14" 
              icon={CheckCircle2} 
              description="Telah selesai & diverifikasi" 
              colorClass="text-success border-success/20 bg-success/10"
            />
          </div>

          {/* Member tasks layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-foreground mb-4">Task Sedang Dikerjakan (In Progress)</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-surface-1 border border-border hover:border-border-light transition-all duration-200">
                  <span className="inline-flex items-center rounded-md bg-member/10 px-2 py-0.5 text-xs font-semibold text-member ring-1 ring-inset ring-member/20">Development</span>
                  <h4 className="mt-2 font-medium text-foreground text-sm">Implementasi Page Login (Frontend Next.js)</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Deadline: Besok pagi</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-1 border border-border hover:border-border-light transition-all duration-200">
                  <span className="inline-flex items-center rounded-md bg-member/10 px-2 py-0.5 text-xs font-semibold text-member ring-1 ring-inset ring-member/20">API Integration</span>
                  <h4 className="mt-2 font-medium text-foreground text-sm">Fix CORS & CSRF-Cookie connection di API backend</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Deadline: Lusa</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-foreground mb-4">Task Menunggu Review (Pending Approval)</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-surface-1/40 border border-border border-dashed flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground/80 text-sm">Migration schema roles & users</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Sudah di-submit 2 jam lalu</p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-warning/10 px-2 py-1 text-xs font-semibold text-warning ring-1 ring-inset ring-warning/20">Review PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'client':
      return (
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Card */}
          <div className="glass relative overflow-hidden rounded-2xl p-6 border-l-4 border-client">
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-client/10 border border-client/20 text-client">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Selamat Datang, Client!</h2>
                <p className="mt-1 text-sm text-muted">
                  Pantau perkembangan project Anda secara transparan. Anda dapat melihat milestone, log aktivitas terbaru, dan status pengerjaan tim kami.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard 
              title="Project Aktif Anda" 
              value="1" 
              icon={Briefcase} 
              description="Project Anda yang sedang berjalan" 
              colorClass="text-client border-client/20 bg-client/10"
            />
            <StatCard 
              title="Milestone Selesai" 
              value="3 / 5" 
              icon={CheckCircle2} 
              description="Progress pengerjaan fase" 
              colorClass="text-success border-success/20 bg-success/10"
            />
            <StatCard 
              title="Hari Tersisa" 
              value="19 Hari" 
              icon={Clock} 
              description="Menuju target peluncuran" 
              colorClass="text-warning border-warning/20 bg-warning/10"
            />
          </div>

          {/* Client Project Overview */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-foreground mb-4">Milestone Perkembangan Project</h3>
            <div className="relative border-l border-border pl-6 space-y-8 ml-4">
              {/* Timeline item 1 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-success ring-4 ring-surface-0">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Fase 1: Riset & Kebutuhan Desain UI/UX</h4>
                  <p className="mt-1 text-xs text-muted">Selesai pada: 10 Agustus 2026</p>
                </div>
              </div>
              {/* Timeline item 2 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-success ring-4 ring-surface-0">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Fase 2: Implementasi Database & REST API Backend</h4>
                  <p className="mt-1 text-xs text-muted">Selesai pada: 25 Agustus 2026</p>
                </div>
              </div>
              {/* Timeline item 3 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-surface-0">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary">Fase 3: Pembangunan Portal Dashboard Frontend (React/Next)</h4>
                  <p className="mt-1 text-xs text-muted">Status: Sedang Dikerjakan (Progress 75%)</p>
                </div>
              </div>
              {/* Timeline item 4 */}
              <div className="relative opacity-60">
                <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-3 ring-4 ring-surface-0">
                  <div className="h-2 w-2 rounded-full bg-transparent" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Fase 4: User Acceptance Testing (UAT)</h4>
                  <p className="mt-1 text-xs text-muted">Status: Belum Mulai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-error" />
          <h3 className="text-lg font-bold text-foreground">Akses Ditolak</h3>
          <p className="max-w-xs text-sm text-muted">Role Anda tidak dikenali. Silakan hubungi administrator.</p>
        </div>
      );
  }
}
