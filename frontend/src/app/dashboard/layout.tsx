'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Get color theme based on role
  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return 'text-super-admin border-super-admin/20 bg-super-admin/10';
      case 'project_manager':
        return 'text-project-manager border-project-manager/20 bg-project-manager/10';
      case 'member':
        return 'text-member border-member/20 bg-member/10';
      case 'client':
        return 'text-client border-client/20 bg-client/10';
      default:
        return 'text-primary border-primary/20 bg-primary/10';
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface-1 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
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

        {/* Sidebar User Profile */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-border-light text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-medium text-sm text-foreground truncate">{user.username}</h4>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          </div>
          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${getRoleColor(user.role.role_name)}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{user.role.display_name}</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </a>

          {user.role.role_name === 'super_admin' && (
            <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
              <Users className="h-5 w-5" />
              <span>Kelola User & Role</span>
            </a>
          )}

          {(user.role.role_name === 'super_admin' || user.role.role_name === 'project_manager') && (
            <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
              <Briefcase className="h-5 w-5" />
              <span>Semua Project</span>
            </a>
          )}

          {user.role.role_name === 'member' && (
            <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
              <CheckSquare className="h-5 w-5" />
              <span>Task Saya</span>
            </a>
          )}

          {user.role.role_name === 'client' && (
            <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
              <FolderLock className="h-5 w-5" />
              <span>Project Saya</span>
            </a>
          )}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error hover:bg-error/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
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
            <h1 className="font-semibold text-lg text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-foreground">{user.username}</span>
              <span className="text-xs text-muted-foreground">{user.role.display_name}</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center text-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {/* Header Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-error/25 bg-error/5 hover:bg-error/15 px-3 py-1.5 text-xs font-semibold text-error transition-all duration-200"
              title="Keluar dari sesi"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
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
