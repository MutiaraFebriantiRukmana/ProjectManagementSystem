import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CheckSquare, 
  FolderLock, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export default function AuthenticatedLayout({
  header,
  children,
}: {
  header?: string;
  children: React.ReactNode;
}) {
  const { auth, url } = usePage<PageProps & { url: string }>().props;
  const user = auth.user;
  const currentUrl = usePage().url;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ambil role utama dari Spatie array
  const roleRaw = user?.roles?.[0];
  const currentRole = (typeof roleRaw === 'string' ? roleRaw : roleRaw?.name) || 'member';

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
      case 'Super Admin':
        return 'text-super-admin border-super-admin/20 bg-super-admin/10';
      case 'project_manager':
      case 'Project Manager':
        return 'text-project-manager border-project-manager/20 bg-project-manager/10';
      case 'member':
      case 'Member':
        return 'text-member border-member/20 bg-member/10';
      case 'client':
      case 'Viewer / Client':
        return 'text-client border-client/20 bg-client/10';
      default:
        return 'text-primary border-primary/20 bg-primary/10';
    }
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  const isDashboard = currentUrl === '/dashboard' || currentUrl.startsWith('/dashboard?');
  const isProjects = currentUrl.startsWith('/projects');
  const isUsers = currentUrl.startsWith('/admin/users');
  const isRoles = currentUrl.startsWith('/admin/roles') || currentUrl.startsWith('/admin/permissions');

  const getNavLinkClass = (active: boolean) => {
    return `group flex items-center gap-3 px-4 py-3 text-sm transition-all ${
      active
        ? 'bg-gradient-to-r from-primary/20 to-transparent border-l-4 border-primary text-white font-semibold rounded-r-xl'
        : 'text-muted hover:bg-surface-2 hover:text-foreground rounded-xl border-l-4 border-transparent font-medium'
    }`;
  };

  const getNavIconClass = (active: boolean) => {
    return `h-5 w-5 transition-colors ${active ? 'text-primary' : 'group-hover:text-primary'}`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0 relative">
      {/* ── Atmospheric Glows ── */}
      <div className="pointer-events-none fixed -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary opacity-[0.06] blur-[150px] z-0" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-secondary opacity-[0.06] blur-[150px] z-0" />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface-1 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-foreground tracking-wide">PM System</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-surface-2 lg:hidden text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-border-light text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-medium text-sm text-foreground truncate">{user?.username}</h4>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${getRoleColor(currentRole)}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="capitalize">{currentRole.replace('_', ' ')}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto relative z-10">
          <Link href="/dashboard" className={getNavLinkClass(isDashboard)}>
            <LayoutDashboard className={getNavIconClass(isDashboard)} />
            <span>Dasbor</span>
          </Link>

          <Link href="/projects" className={getNavLinkClass(isProjects)}>
            <Briefcase className={getNavIconClass(isProjects)} />
            <span>Manajemen Project</span>
          </Link>

          {(currentRole === 'super_admin' || currentRole === 'Super Admin') && (
            <>
              <div className="mt-2 mb-1 px-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</span>
              </div>
              <Link href="/admin/users" className={getNavLinkClass(isUsers)}>
                <Users className={getNavIconClass(isUsers)} />
                <span>Kelola Pengguna</span>
              </Link>
              <Link href="/admin/roles" className={getNavLinkClass(isRoles)}>
                <KeyRound className={getNavIconClass(isRoles)} />
                <span>Kelola Hak Akses</span>
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface-1 px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 hover:bg-surface-2 lg:hidden text-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-lg text-foreground">{header || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-foreground">{user?.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{currentRole.replace('_', ' ')}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center text-primary font-bold">
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}