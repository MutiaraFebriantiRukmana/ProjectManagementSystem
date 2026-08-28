import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Project, User } from '@/types';
import {
  Briefcase,
  AlignLeft,
  Activity,
  Calendar,
  ChevronRight,
  Loader2,
  Save,
  X,
  AlertCircle,
  UserCog,
} from 'lucide-react';

type Status = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

interface EditFormData {
  manager_id: string;
  name: string;
  description: string;
  status: Status;
  start_date: string;
  end_date: string;
}

interface EditProps {
  project: Project;
  managers: User[];
  available_members: User[];
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'planning',  label: 'Planning' },
  { value: 'active',    label: 'Active' },
  { value: 'on_hold',   label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ─── Reusable field wrapper ────────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function Edit({ project, managers, available_members }: EditProps) {
  // Pre-populate form from the existing project (Inertia passes the project prop)
  const { data, setData, put, processing, errors } = useForm<EditFormData>({
    manager_id:  String(project.manager_id),
    name:        project.name,
    description: project.description ?? '',
    status:      project.status as Status,
    start_date:  project.start_date
      ? project.start_date.substring(0, 10)   // Normalise to YYYY-MM-DD
      : '',
    end_date: project.end_date
      ? project.end_date.substring(0, 10)
      : '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/projects/${project.id}`);
  };

  return (
    <AuthenticatedLayout header={`Edit: ${project.name}`}>
      <Head title={`Edit — ${project.name}`} />

      <div className="max-w-2xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/projects/${project.id}`}
            className="hover:text-foreground transition-colors truncate max-w-[12rem]"
          >
            {project.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Edit</span>
        </nav>

        {/* Form Card */}
        <div className="glass-card p-6 shadow-xl">
          {/* Card header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 border border-warning/20">
              <Briefcase className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Edit Detail Project</h2>
              <p className="text-xs text-muted">
                Perbarui informasi project{' '}
                <span className="font-semibold text-foreground">{project.name}</span>
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* ── Manager Dropdown ─────────────────────────────────────── */}
            <Field label="Project Manager" error={errors.manager_id} required>
              <div className="relative">
                <UserCog className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  id="project-manager-id"
                  value={data.manager_id}
                  onChange={(e) => setData('manager_id', e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="" className="bg-surface-2">-- Pilih Project Manager --</option>
                  {managers.map((u) => (
                    <option key={u.id} value={String(u.id)} className="bg-surface-2">
                      {u.username} — {u.email}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Mengubah Project Manager akan memindahkan hak akses kelola anggota ke user baru.
              </p>
            </Field>

            {/* Name */}
            <Field label="Nama Project" error={errors.name} required>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="project-name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Nama project..."
                  required
                  autoFocus
                  className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </Field>

            {/* Description */}
            <Field label="Deskripsi" error={errors.description}>
              <div className="relative">
                <AlignLeft className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="project-description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Deskripsi project..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </Field>

            {/* Status */}
            <Field label="Status" error={errors.status} required>
              <div className="relative">
                <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  id="project-status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value as Status)}
                  className="w-full appearance-none rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-surface-2">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            {/* Date range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Mulai" error={errors.start_date}>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="project-start-date"
                    type="date"
                    value={data.start_date}
                    onChange={(e) => setData('start_date', e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                  />
                </div>
              </Field>

              <Field label="Deadline (End Date)" error={errors.end_date} required>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="project-end-date"
                    type="date"
                    value={data.end_date}
                    onChange={(e) => setData('end_date', e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                  />
                </div>
              </Field>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href={`/projects/${project.id}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                Batal
              </Link>
              <button
                id="btn-update-project"
                type="submit"
                disabled={processing}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
