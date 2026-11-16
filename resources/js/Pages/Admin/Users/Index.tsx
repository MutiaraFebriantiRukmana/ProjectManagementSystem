import React, { useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ConfirmModal from "@/Components/ConfirmModal";
import { PageProps, PaginatedResponse, User } from "@/types";
import {
    Plus, Search, Edit2, Trash2, X, Loader2, Users,
    ShieldCheck, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Role {
    id: number;
    name: string;
}
interface AdminUser extends User {
    roles: Role[];
    created_at?: string;
}
interface Props {
    users: PaginatedResponse<AdminUser>;
    roles: Role[];
    filters: { search: string };
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
    super_admin:     { label: "Super Admin",     cls: "bg-primary/15 text-primary border-primary/30" },
    project_manager: { label: "Project Manager", cls: "bg-secondary/15 text-secondary border-secondary/30" },
    member:          { label: "Member",          cls: "bg-slate-400/15 text-slate-300 border-slate-400/30" },
    client:          { label: "Client",          cls: "bg-purple-400/15 text-purple-300 border-purple-400/30" },
};
function getRoleCfg(name: string) {
    return ROLE_CONFIG[name] ?? { label: name, cls: "bg-surface-2 text-muted border-border" };
}

function UserModal({ user, roles, onClose }: { user: AdminUser | null; roles: Role[]; onClose: () => void }) {
    const isEdit = !!user;
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        username: user?.username ?? "",
        email: user?.email ?? "",
        password: "",
        role: (user?.roles?.[0]?.name ?? roles[0]?.name ?? ""),
    });
    const [confirmSave, setConfirmSave] = useState(false);
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmSave(true);
    };

    const handleConfirmSubmit = () => {
        if (isEdit) {
            patch(`/admin/users/${user!.id}`, { onSuccess: () => { reset(); onClose(); } });
        } else {
            post("/admin/users", { onSuccess: () => { reset(); onClose(); } });
        }
        setConfirmSave(false);
    };
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-8 py-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">{isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h3>
                            <p className="text-xs text-muted">{isEdit ? `Mengedit akun ${user!.username}` : "Buat akun pengguna baru"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-surface-2 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={submit} className="px-8 py-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">Nama Pengguna <span className="text-error">*</span></label>
                        <input type="text" value={data.username} onChange={e => setData("username", e.target.value)} required placeholder="nama_pengguna"
                            className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        {errors.username && <p className="text-xs text-error">{errors.username}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">Email <span className="text-error">*</span></label>
                        <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} required
                            className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        {errors.email && <p className="text-xs text-error">{errors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">
                            Kata Sandi {isEdit ? <span className="text-muted font-normal text-xs">(kosongkan jika tidak diubah)</span> : <span className="text-error">*</span>}
                        </label>
                        <input type="password" value={data.password} onChange={e => setData("password", e.target.value)} required={!isEdit} placeholder={isEdit ? "Biarkan kosong jika tidak diubah" : "Min. 8 karakter"}
                            className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        {errors.password && <p className="text-xs text-error">{errors.password}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-foreground">Role <span className="text-error">*</span></label>
                        <select value={data.role} onChange={e => setData("role", e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                            {roles.map(r => <option key={r.id} value={r.name} className="bg-surface-2">{getRoleCfg(r.name).label}</option>)}
                        </select>
                        {errors.role && <p className="text-xs text-error">{errors.role}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface-2 transition-colors">Batal</button>
                        <button type="submit" disabled={processing} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition-all">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {isEdit ? "Simpan Perubahan" : "Buat Pengguna"}
                        </button>
                    </div>
                </form>
            </div>
            <ConfirmModal
                isOpen={confirmSave}
                title="Konfirmasi Penyimpanan"
                message={`Apakah Anda yakin ingin ${isEdit ? "menyimpan perubahan untuk pengguna ini" : "menambahkan pengguna baru ini"}?`}
                onConfirm={handleConfirmSubmit}
                onCancel={() => setConfirmSave(false)}
                confirmText="Ya, Simpan"
                cancelText="Batal"
                variant="primary"
            />
        </div>
    );
}

export default function AdminUsersIndex({ users, roles, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? "");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); router.get("/admin/users", { search }, { preserveState: true, replace: true }); };
    const openCreate = () => { setEditingUser(null); setShowModal(true); };
    const openEdit = (u: AdminUser) => { setEditingUser(u); setShowModal(true); };
    const confirmDelete = () => {
        if (!deletingUser) return;
        router.delete(`/admin/users/${deletingUser.id}`, { preserveScroll: true, onFinish: () => setDeletingUser(null) });
    };

    return (
        <AuthenticatedLayout header="Manajemen Pengguna">
            <Head title="Manajemen Pengguna" />
            <div className="space-y-6">
                {(flash?.success || flash?.error) && (
                    <div>
                        {flash.success && <div className="flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 px-4 py-3"><CheckCircle2 className="h-5 w-5 text-success shrink-0" /><p className="text-sm text-success">{flash.success}</p></div>}
                        {flash.error && <div className="flex items-center gap-3 rounded-xl bg-error/10 border border-error/20 px-4 py-3"><AlertTriangle className="h-5 w-5 text-error shrink-0" /><p className="text-sm text-error">{flash.error}</p></div>}
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Manajemen Pengguna</h1>
                        <p className="mt-1 text-sm text-muted">Kelola seluruh akun pengguna dan peran mereka dalam sistem.</p>
                    </div>
                    <button id="btn-create-user" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all">
                        <Plus className="h-4 w-4" /> Tambah Pengguna
                    </button>
                </div>
                <div className="glass-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted" />
                            <span className="text-sm font-semibold text-foreground">Daftar Pengguna</span>
                            <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-xs font-medium text-muted">{users.total}</span>
                        </div>
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengguna..."
                                    className="rounded-xl border border-border bg-surface-1 py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-56 transition-all" />
                            </div>
                            <button type="submit" className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:bg-surface-2 transition-colors">Cari</button>
                        </form>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-surface-2/50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pengguna</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.data.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-14 text-center text-sm text-muted">Tidak ada pengguna ditemukan.</td></tr>
                                ) : users.data.map(u => {
                                    const roleRaw = u.roles?.[0];
                                    const roleName = typeof roleRaw === "string" ? roleRaw : (roleRaw as any)?.name ?? "member";
                                    const roleCfg = getRoleCfg(roleName);
                                    return (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                                                        {u.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-foreground">{u.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleCfg.cls}`}>
                                                    <ShieldCheck className="h-3 w-3" />{roleCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button id={`edit-user-${u.id}`} onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors" title="Edit"><Edit2 className="h-4 w-4" /></button>
                                                    <button id={`delete-user-${u.id}`} onClick={() => setDeletingUser(u)} className="p-1.5 rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors" title="Hapus"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {users.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                            <p className="text-xs text-muted">Menampilkan {users.from ?? 0}–{users.to ?? 0} dari {users.total} pengguna</p>
                            <div className="flex items-center gap-1">
                                {users.prev_page_url && <button onClick={() => router.get(users.prev_page_url!, {}, { preserveState: true })} className="p-1.5 rounded-lg border border-border text-muted hover:bg-surface-2 transition-colors"><ChevronLeft className="h-4 w-4" /></button>}
                                <span className="px-3 text-xs text-muted">Hal {users.current_page} / {users.last_page}</span>
                                {users.next_page_url && <button onClick={() => router.get(users.next_page_url!, {}, { preserveState: true })} className="p-1.5 rounded-lg border border-border text-muted hover:bg-surface-2 transition-colors"><ChevronRight className="h-4 w-4" /></button>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showModal && <UserModal user={editingUser} roles={roles} onClose={() => setShowModal(false)} />}
            <ConfirmModal isOpen={!!deletingUser} title="Hapus Pengguna?" message={`Apakah Anda yakin ingin menghapus pengguna "${deletingUser?.username}"? Tindakan ini tidak dapat dibatalkan.`} confirmText="Ya, Hapus" cancelText="Batal" type="danger" onConfirm={confirmDelete} onCancel={() => setDeletingUser(null)} />
        </AuthenticatedLayout>
    );
}
