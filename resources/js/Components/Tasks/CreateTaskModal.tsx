import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Task, Label, User } from '@/types';
import {
    X,
    Loader2,
    Plus,
    ClipboardList,
    ChevronDown,
    Check,
} from 'lucide-react';

interface CreateTaskModalProps {
    projectId: number;
    projectTasks: Task[];
    projectMembers: User[];
    labels: Label[];
    defaultStatus?: Task['status'];
    onClose: () => void;
}

// ─── Multi-Select Dropdown ────────────────────────────────────────────────────
interface MultiSelectProps<T> {
    id: string;
    label: string;
    items: T[];
    selected: number[];
    getKey: (item: T) => number;
    getLabel: (item: T) => string;
    getColor?: (item: T) => string;
    onChange: (ids: number[]) => void;
}

function MultiSelect<T>({
    id,
    label,
    items,
    selected,
    getKey,
    getLabel,
    getColor,
    onChange,
}: MultiSelectProps<T>) {
    const [open, setOpen] = useState(false);

    const toggle = (key: number) => {
        if (selected.includes(key)) {
            onChange(selected.filter((k) => k !== key));
        } else {
            onChange([...selected, key]);
        }
    };

    const selectedItems = items.filter((item) => selected.includes(getKey(item)));

    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    id={id}
                    onClick={() => setOpen((v) => !v)}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-left outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                    <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                        {selectedItems.length === 0 ? (
                            <span className="text-muted">Pilih {label}...</span>
                        ) : (
                            selectedItems.map((item) => (
                                <span
                                    key={getKey(item)}
                                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                    style={
                                        getColor
                                            ? {
                                                  backgroundColor: `${getColor(item)}18`,
                                                  color: getColor(item),
                                                  border: `1px solid ${getColor(item)}35`,
                                              }
                                            : {
                                                  backgroundColor: 'rgba(252,165,193,0.1)',
                                                  color: 'var(--color-primary)',
                                                  border: '1px solid rgba(252,165,193,0.2)',
                                              }
                                    }
                                >
                                    {getLabel(item)}
                                </span>
                            ))
                        )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute top-full left-0 right-0 z-20 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface-2 shadow-2xl backdrop-blur-xl">
                            {items.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted">Tidak ada pilihan</p>
                            ) : (
                                items.map((item) => {
                                    const key = getKey(item);
                                    const isSelected = selected.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggle(key)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-surface-3 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {getColor && (
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: getColor(item) }}
                                                    />
                                                )}
                                                <span className="text-foreground">{getLabel(item)}</span>
                                            </div>
                                            {isSelected && (
                                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateTaskModal({
    projectId,
    projectTasks,
    projectMembers,
    labels,
    defaultStatus = 'todo',
    onClose,
}: CreateTaskModalProps) {
    // Filter assignees (use all project members)
    const assignableMembers = projectMembers;

    const { data, setData, post, processing, errors, reset } = useForm({
        project_id: projectId,
        title: '',
        description: '',
        status: defaultStatus as Task['status'],
        priority: 'medium' as Task['priority'],
        start_date: '',
        end_date: '',
        requires_approval: false,
        assignees: [] as number[],
        labels: [] as number[],
        dependencies: [] as number[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tasks', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Buat Task Baru</h3>
                            <p className="text-xs text-muted">Isi detail task yang ingin dibuat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="overflow-y-auto flex-1 px-8 py-6 space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label htmlFor="task-title" className="block text-sm font-medium text-foreground">
                            Judul Task <span className="text-error">*</span>
                        </label>
                        <input
                            id="task-title"
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                            placeholder="Masukkan judul task..."
                            className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        {errors.title && <p className="text-xs text-error">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label htmlFor="task-description" className="block text-sm font-medium text-foreground">
                            Deskripsi
                        </label>
                        <textarea
                            id="task-description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            placeholder="Jelaskan detail task..."
                            className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        />
                    </div>

                    {/* Status + Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="task-status" className="block text-sm font-medium text-foreground">
                                Status
                            </label>
                            <div className="relative">
                                <select
                                    id="task-status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as Task['status'])}
                                    className="w-full appearance-none rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="backlog">Backlog</option>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">In Review</option>
                                    <option value="done">Done</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="task-priority" className="block text-sm font-medium text-foreground">
                                Priority
                            </label>
                            <div className="relative">
                                <select
                                    id="task-priority"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value as Task['priority'])}
                                    className="w-full appearance-none rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Start + End Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="task-start-date" className="block text-sm font-medium text-foreground">
                                Tanggal Mulai
                            </label>
                            <input
                                id="task-start-date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="task-end-date" className="block text-sm font-medium text-foreground">
                                Deadline
                            </label>
                            <input
                                id="task-end-date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Assignees */}
                    <MultiSelect
                        id="task-assignees"
                        label="Ditugaskan Kepada (Assignees)"
                        items={assignableMembers}
                        selected={data.assignees}
                        getKey={(u) => u.id}
                        getLabel={(u) => u.username}
                        onChange={(ids) => setData('assignees', ids)}
                    />

                    {/* Labels */}
                    <MultiSelect
                        id="task-labels"
                        label="Labels"
                        items={labels}
                        selected={data.labels}
                        getKey={(l) => l.id}
                        getLabel={(l) => l.name}
                        getColor={(l) => l.color}
                        onChange={(ids) => setData('labels', ids)}
                    />

                    {/* Dependencies */}
                    <MultiSelect
                        id="task-dependencies"
                        label="Prasyarat (Dependencies)"
                        items={projectTasks}
                        selected={data.dependencies}
                        getKey={(t) => t.id}
                        getLabel={(t) => t.title}
                        onChange={(ids) => setData('dependencies', ids)}
                    />

                    {/* Requires Approval */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            id="task-requires-approval"
                            onClick={() => setData('requires_approval', !data.requires_approval)}
                            className={`relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0 border ${
                                data.requires_approval ? 'bg-primary border-primary' : 'bg-surface-3 border-border'
                            }`}
                        >
                            <span
                                className={`absolute top-[1px] left-[1px] h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                                    data.requires_approval ? 'translate-x-[14px]' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        <label
                            htmlFor="task-requires-approval"
                            className="text-sm text-foreground cursor-pointer"
                            onClick={() => setData('requires_approval', !data.requires_approval)}
                        >
                            Membutuhkan Approval
                        </label>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-3 px-8 py-6 border-t border-border shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface-2 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        id="submit-create-task"
                        type="submit"
                        onClick={submit}
                        disabled={processing || !data.title.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition-all"
                    >
                        {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Buat Task
                    </button>
                </div>
            </div>
        </div>
    );
}
