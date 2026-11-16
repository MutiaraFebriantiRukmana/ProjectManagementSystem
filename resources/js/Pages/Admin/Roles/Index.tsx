import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ConfirmModal from "@/Components/ConfirmModal";
import { PageProps } from "@/types";
import { ShieldCheck, Save, CheckCircle2, AlertTriangle } from "lucide-react";

interface Permission {
    id: number;
    name: string;
}
interface Role {
    id: number;
    name: string;
    permissions: string[];
}
interface Props {
    roles: Role[];
    permissions: Permission[];
}

const ROLE_CONFIG: Record<string, { label: string; headerCls: string }> = {
    super_admin:     { label: "Super Admin",     headerCls: "text-primary" },
    project_manager: { label: "Project Manager", headerCls: "text-secondary" },
    member:          { label: "Member",          headerCls: "text-slate-300" },
    client:          { label: "Client",          headerCls: "text-purple-300" },
};

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce((acc, p) => {
        const group = p.name.includes(".") ? p.name.split(".")[0] : "Lainnya";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);
}

export default function AdminRolesIndex({ roles, permissions }: Props) {
    const { flash } = usePage<PageProps>().props;

    // Local permission state per role
    const [matrix, setMatrix] = useState<Record<number, Set<string>>>(() => {
        const m: Record<number, Set<string>> = {};
        roles.forEach(r => { m[r.id] = new Set(r.permissions); });
        return m;
    });

    const [pendingSave, setPendingSave] = useState<Role | null>(null);
    const [saving, setSaving] = useState(false);

    const togglePermission = (roleId: number, permName: string) => {
        setMatrix(prev => {
            const next = new Map(Object.entries(prev).map(([k, v]) => [Number(k), new Set(v)]));
            const set = next.get(roleId) ?? new Set<string>();
            if (set.has(permName)) { set.delete(permName); } else { set.add(permName); }
            next.set(roleId, set);
            return Object.fromEntries(next.entries());
        });
    };

    const saveRole = (role: Role) => {
        if (saving) return;
        setSaving(true);
        const perms = Array.from(matrix[role.id] ?? []);
        router.patch(`/admin/roles/${role.id}/permissions`, { permissions: perms }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => { setPendingSave(null); },
            onFinish: () => setSaving(false),
        });
    };

    const grouped = groupPermissions(permissions);

    return (
        <AuthenticatedLayout header="Kelola Hak Akses">
            <Head title="Kelola Hak Akses" />
            <div className="space-y-6">
                {(flash?.success || flash?.error) && (
                    <div>
                        {flash.success && <div className="flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 px-4 py-3"><CheckCircle2 className="h-5 w-5 text-success shrink-0" /><p className="text-sm text-success">{flash.success}</p></div>}
                        {flash.error && <div className="flex items-center gap-3 rounded-xl bg-error/10 border border-error/20 px-4 py-3"><AlertTriangle className="h-5 w-5 text-error shrink-0" /><p className="text-sm text-error">{flash.error}</p></div>}
                    </div>
                )}

                <div>
                    <h1 className="text-2xl font-bold text-foreground">Matriks Hak Akses</h1>
                    <p className="mt-1 text-sm text-muted">Centang untuk memberikan atau mencabut hak akses dari suatu peran. Klik "Simpan" pada kolom peran yang diubah.</p>
                </div>

                <div className="glass-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-border bg-surface-2/70">
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-56 min-w-[14rem]">
                                    Hak Akses
                                </th>
                                {roles.map(role => {
                                    const cfg = ROLE_CONFIG[role.name] ?? { label: role.name, headerCls: "text-foreground" };
                                    return (
                                        <th key={role.id} className="px-4 py-4 text-center min-w-[140px]">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <ShieldCheck className={`h-4 w-4 ${cfg.headerCls}`} />
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.headerCls}`}>{cfg.label}</span>
                                                </div>
                                                <button
                                                    id={`save-role-${role.id}`}
                                                    onClick={() => setPendingSave(role)}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                                                >
                                                    <Save className="h-3 w-3" />
                                                    Simpan
                                                </button>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(grouped).map(([group, perms]) => (
                                <React.Fragment key={group}>
                                    <tr className="bg-surface-2/40 border-t border-border">
                                        <td colSpan={roles.length + 1} className="px-6 py-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{group}</span>
                                        </td>
                                    </tr>
                                    {perms.map(perm => (
                                        <tr key={perm.id} className="border-t border-border/50 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-mono text-white">{perm.name}</span>
                                            </td>
                                            {roles.map(role => {
                                                const checked = matrix[role.id]?.has(perm.name) ?? false;
                                                return (
                                                    <td key={role.id} className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePermission(role.id, perm.name)}
                                                            className={`relative inline-flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150 ${
                                                                checked
                                                                    ? "bg-primary border-primary/50 shadow-sm shadow-primary/30"
                                                                    : "bg-surface-1 border-border hover:border-primary/40"
                                                            }`}
                                                        >
                                                            {checked && (
                                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {permissions.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                            <ShieldCheck className="h-12 w-12 text-muted opacity-40" />
                            <p className="text-sm text-muted">Belum ada hak akses terdaftar di sistem.</p>
                            <p className="text-xs text-muted-foreground">Jalankan seeder untuk membuat permission awal.</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!pendingSave}
                title="Simpan Perubahan Hak Akses?"
                message={`Apakah Anda yakin ingin menyimpan perubahan hak akses untuk peran "${pendingSave ? (ROLE_CONFIG[pendingSave.name]?.label ?? pendingSave.name) : ""}"?`}
                confirmText="Ya, Simpan"
                cancelText="Batal"
                type="primary"
                onConfirm={() => pendingSave && saveRole(pendingSave)}
                onCancel={() => setPendingSave(null)}
            />
        </AuthenticatedLayout>
    );
}
