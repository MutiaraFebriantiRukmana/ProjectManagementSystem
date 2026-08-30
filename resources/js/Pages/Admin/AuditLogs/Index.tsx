import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { ActivityLog, User } from '@/types';
import { 
    FileText, 
    Filter, 
    User as UserIcon, 
    Clock, 
    Eye, 
    X, 
    ChevronLeft, 
    ChevronRight,
    ArrowRight,
    Sparkles
} from 'lucide-react';

interface PaginatedLogs {
    data: ActivityLog[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    logs: PaginatedLogs;
    users: User[];
    actions: string[];
    filters: {
        user_id?: string;
        action?: string;
    };
}

export default function AuditLogIndex({ logs, users, actions, filters }: Props) {
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [selectedUser, setSelectedUser] = useState(filters.user_id || '');
    const [selectedAction, setSelectedAction] = useState(filters.action || '');

    const handleFilterChange = (userId: string, actionName: string) => {
        router.get('/admin/audit-logs', {
            user_id: userId || undefined,
            action: actionName || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getActionBadgeClass = (action: string) => {
        if (action.includes('CREATED')) return 'bg-success/10 text-success border-success/25';
        if (action.includes('DELETED')) return 'bg-error/10 text-error border-error/25';
        if (action.includes('STATUS')) return 'bg-warning/10 text-warning border-warning/25';
        return 'bg-primary/10 text-primary border-primary/25';
    };

    return (
        <AuthenticatedLayout header="Audit & Activity Logs">
            <Head title="Audit Logs" />

            <div className="space-y-6">
                {/* Header Card */}
                <div className="glass rounded-2xl p-6 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-foreground">Sistem Audit Trail</h2>
                        </div>
                        <p className="text-xs text-muted mt-1">
                            Merekam seluruh riwayat perubahan entitas, status task, dan aktivitas pengguna secara transparan (Poin 14 Brief).
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-muted">
                        Total {logs.total} Log Aktivitas
                    </span>
                </div>

                {/* Filter Bar */}
                <div className="glass rounded-2xl p-4 border border-border flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                        <Filter className="h-4 w-4 text-primary" />
                        <span>Filter:</span>
                    </div>

                    {/* Filter User */}
                    <select
                        value={selectedUser}
                        onChange={(e) => {
                            setSelectedUser(e.target.value);
                            handleFilterChange(e.target.value, selectedAction);
                        }}
                        className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                    >
                        <option value="">Semua User Pelaku</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                    </select>

                    {/* Filter Action */}
                    <select
                        value={selectedAction}
                        onChange={(e) => {
                            setSelectedAction(e.target.value);
                            handleFilterChange(selectedUser, e.target.value);
                        }}
                        className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                    >
                        <option value="">Semua Jenis Aksi</option>
                        {actions.map((act) => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                    </select>

                    {(selectedUser || selectedAction) && (
                        <button
                            onClick={() => {
                                setSelectedUser('');
                                setSelectedAction('');
                                handleFilterChange('', '');
                            }}
                            className="text-xs text-error hover:underline ml-auto"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* Logs Table */}
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border bg-surface-1/50 text-xs font-semibold text-muted uppercase">
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">User Pelaku</th>
                                    <th className="px-6 py-4">Aksi</th>
                                    <th className="px-6 py-4">Target Entitas</th>
                                    <th className="px-6 py-4 text-right">Detail Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted">
                                            Tidak ada data log yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-surface-2/30 transition-colors">
                                            <td className="px-6 py-4 text-xs text-muted whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {new Date(log.created_at).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {log.user?.username?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-semibold text-foreground text-xs">
                                                        {log.user?.username || 'Sistem Otomatis'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${getActionBadgeClass(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted">
                                                <span className="font-mono text-foreground">
                                                    {log.entity_type?.split('\\').pop()} #{log.entity_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Lihat Diff
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-1/40">
                            <span className="text-xs text-muted">
                                Halaman {logs.current_page} dari {logs.last_page}
                            </span>
                            <div className="flex gap-1">
                                {logs.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-primary text-white'
                                                : link.url
                                                ? 'border border-border text-muted hover:bg-surface-2 hover:text-foreground'
                                                : 'text-muted/40 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL JSON DIFF VIEWER (Perbandingan Old vs New) ── */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="glass w-full max-w-2xl rounded-2xl border border-border overflow-hidden bg-surface-1 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-2/40">
                            <div>
                                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Inspeksi Perubahan Data: {selectedLog.action}
                                </h3>
                                <p className="text-xs text-muted mt-0.5">
                                    Target: {selectedLog.entity_type?.split('\\').pop()} #{selectedLog.entity_id} oleh {selectedLog.user?.username || 'Sistem'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body Comparison */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Old Values */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-error" />
                                        Nilai Lama (Old Value)
                                    </h4>
                                    <div className="rounded-xl border border-error/20 bg-error/5 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto min-h-[120px]">
                                        {selectedLog.old_value && Object.keys(selectedLog.old_value).length > 0
                                            ? JSON.stringify(selectedLog.old_value, null, 2)
                                            : '— (Data Awal / Kosong)'}
                                    </div>
                                </div>

                                {/* New Values */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-success" />
                                        Nilai Baru (New Value)
                                    </h4>
                                    <div className="rounded-xl border border-success/20 bg-success/5 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto min-h-[120px]">
                                        {selectedLog.new_value && Object.keys(selectedLog.new_value).length > 0
                                            ? JSON.stringify(selectedLog.new_value, null, 2)
                                            : '— (Dihapus)'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border px-6 py-3 bg-surface-2/30 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-2"
                            >
                                Tutup Inspeksi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}