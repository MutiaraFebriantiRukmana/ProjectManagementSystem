import React, { useState, useCallback, useEffect } from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import { Task, Label, User } from '@/types';
import TaskCard from './TaskCard';
import { Search, SlidersHorizontal, X, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

// ─── Column Definitions ───────────────────────────────────────────────────────
type KanbanStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

const COLUMNS: { id: KanbanStatus; label: string; accent: string; bg: string; dotColor: string }[] = [
    {
        id: 'backlog',
        label: 'Backlog',
        accent: 'text-slate-400',
        bg: 'bg-slate-400/5 border-slate-400/10',
        dotColor: 'bg-slate-400',
    },
    {
        id: 'todo',
        label: 'To Do',
        accent: 'text-secondary',
        bg: 'bg-secondary/5 border-secondary/10',
        dotColor: 'bg-secondary',
    },
    {
        id: 'in_progress',
        label: 'In Progress',
        accent: 'text-yellow-400',
        bg: 'bg-yellow-400/5 border-yellow-400/10',
        dotColor: 'bg-yellow-400',
    },
    {
        id: 'review',
        label: 'In Review',
        accent: 'text-purple-400',
        bg: 'bg-purple-400/5 border-purple-400/10',
        dotColor: 'bg-purple-400',
    },
    {
        id: 'done',
        label: 'Done',
        accent: 'text-emerald-400',
        bg: 'bg-emerald-400/5 border-emerald-400/10',
        dotColor: 'bg-emerald-400',
    },
];

// ─── Fractional Position Math ─────────────────────────────────────────────────
function calcPosition(
    tasks: Task[],
    destinationIndex: number
): { prev_position: number | null; next_position: number | null } {
    const sorted = [...tasks].sort((a, b) => a.position - b.position);
    const prev = sorted[destinationIndex - 1] ?? null;
    const next = sorted[destinationIndex] ?? null;
    return {
        prev_position: prev ? prev.position : null,
        next_position: next ? next.position : null,
    };
}

// ─── Toast component ──────────────────────────────────────────────────────────
interface ToastProps {
    message: string;
    type: 'error' | 'success';
    onClose: () => void;
}
function Toast({ message, type, onClose }: ToastProps) {
    return (
        <div
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-bottom-2 ${
                type === 'error'
                    ? 'bg-red-500/15 border-red-500/25 text-red-400'
                    : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
            }`}
        >
            {type === 'error' ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span className="text-sm font-medium max-w-xs">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ─── KanbanBoard Props ────────────────────────────────────────────────────────
interface KanbanBoardProps {
    initialTasks: Task[];
    projectMembers: User[];
    labels: Label[];
    onTaskClick: (task: Task) => void;
}

export default function KanbanBoard({
    initialTasks,
    projectMembers,
    labels,
    onTaskClick,
}: KanbanBoardProps) {
    // Member role filter for assignees
    const assignableMembers = projectMembers.filter(m => 
        m.roles?.some((r: any) => (r.name || r) === 'member')
    );

    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<number | 'all'>('all');
    const [filterLabel, setFilterLabel] = useState<number | 'all'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    // Reactive Task Updates
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    // ─── Client-side filter ───────────────────────────────────────────────────
    const filteredTasks = tasks.filter((t) => {
        // Only show parent tasks
        if (t.parent_id !== null) return false;
        
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        if (filterAssignee !== 'all') {
            if (!(t.assignees ?? []).some((a) => a.id === filterAssignee)) return false;
        }
        if (filterLabel !== 'all') {
            if (!(t.labels ?? []).some((l) => l.id === filterLabel)) return false;
        }
        return true;
    });

    // ─── Get tasks for a column, sorted by position ────────────────────────────
    const getColumnTasks = (status: KanbanStatus) =>
        filteredTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

    // ─── Drag End Handler ─────────────────────────────────────────────────────
    const onDragEnd = useCallback(
        (result: DropResult) => {
            const { source, destination, draggableId } = result;
            if (!destination) return;
            if (
                source.droppableId === destination.droppableId &&
                source.index === destination.index
            ) return;

            const taskId = parseInt(draggableId, 10);
            const task = tasks.find((t) => t.id === taskId);
            if (!task) return;

            // Strict Dependency Lock
            const blockedDeps = (task.dependencies ?? []).filter((d) => d.status !== 'done');
            if (blockedDeps.length > 0) {
                showToast('Tugas Terkunci! Selesaikan prasyarat (Dependencies) terlebih dahulu.', 'error');
                return;
            }

            const newStatus = destination.droppableId as KanbanStatus;

            // Snapshot for rollback
            const snapshot = tasks.map((t) => ({ ...t }));

            // Optimistic update — remove from old column, insert into new position
            const destColTasks = tasks
                .filter((t) => t.status === newStatus && t.id !== taskId)
                .sort((a, b) => a.position - b.position);

            const { prev_position, next_position } = calcPosition(destColTasks, destination.index);

            let newPosition: number;
            if (prev_position === null && next_position === null) {
                newPosition = 1000;
            } else if (prev_position === null) {
                newPosition = next_position! / 2;
            } else if (next_position === null) {
                newPosition = prev_position + 1000;
            } else {
                newPosition = (prev_position + next_position) / 2;
            }

            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? { ...t, status: newStatus, position: newPosition }
                        : t
                )
            );

            // Server sync
            router.patch(
                `/tasks/${taskId}/status`,
                {
                    status: newStatus,
                    prev_position: prev_position ?? undefined,
                    next_position: next_position ?? undefined,
                },
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        // Rollback
                        setTasks(snapshot);
                        const errMsg =
                            (errors as any)?.message ||
                            (errors as any)?.status ||
                            'Task tidak dapat diselesaikan karena masih ada dependency yang belum selesai!';
                        showToast(errMsg, 'error');
                    },
                    onSuccess: () => {
                        // Server updated successfully — state already optimistic
                    },
                }
            );
        },
        [tasks]
    );

    const hasFilters = search || filterPriority !== 'all' || filterAssignee !== 'all' || filterLabel !== 'all';

    return (
        <div className="space-y-4">
            {/* ── Filter Bar ───────────────────────────────────────────────── */}
            <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                        id="kanban-search"
                        type="text"
                        placeholder="Cari task..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-1 py-2 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Priority filter */}
                <div className="relative">
                    <select
                        id="kanban-filter-priority"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="appearance-none rounded-xl border border-border bg-surface-1 py-2 pl-3 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        <option value="all">Semua Priority</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
                </div>

                {/* Assignee filter */}
                {assignableMembers.length > 0 && (
                    <div className="relative">
                        <select
                            id="kanban-filter-assignee"
                            value={filterAssignee}
                            onChange={(e) =>
                                setFilterAssignee(
                                    e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                                )
                            }
                            className="appearance-none rounded-xl border border-border bg-surface-1 py-2 pl-3 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="all">Semua Assignee</option>
                            {assignableMembers.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.username}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
                    </div>
                )}

                {/* Label filter */}
                {labels.length > 0 && (
                    <div className="relative">
                        <select
                            id="kanban-filter-label"
                            value={filterLabel}
                            onChange={(e) =>
                                setFilterLabel(
                                    e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                                )
                            }
                            className="appearance-none rounded-xl border border-border bg-surface-1 py-2 pl-3 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="all">Semua Label</option>
                            {labels.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
                    </div>
                )}

                {/* Clear filters */}
                {hasFilters && (
                    <button
                        onClick={() => {
                            setSearch('');
                            setFilterPriority('all');
                            setFilterAssignee('all');
                            setFilterLabel('all');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Reset
                    </button>
                )}

                {/* Total task count */}
                <div className="ml-auto text-xs text-muted">
                    {filteredTasks.length} task
                </div>
            </div>

            {/* ── Kanban Columns ────────────────────────────────────────────── */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-6">
                    {COLUMNS.map((col) => {
                        const colTasks = getColumnTasks(col.id);
                        return (
                            <div
                                key={col.id}
                                className={`flex flex-col rounded-2xl border backdrop-blur-xl min-h-[400px] ${col.bg}`}
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                                        <span className={`text-sm font-semibold ${col.accent}`}>
                                            {col.label}
                                        </span>
                                    </div>
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-muted">
                                        {colTasks.length}
                                    </span>
                                </div>

                                {/* Droppable Area */}
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 flex flex-col gap-2.5 p-3 transition-colors duration-200 ${
                                                snapshot.isDraggingOver
                                                    ? 'bg-white/[0.03]'
                                                    : ''
                                            }`}
                                        >
                                            {colTasks.map((task, index) => (
                                                <Draggable
                                                    key={task.id}
                                                    draggableId={String(task.id)}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                zIndex: snapshot.isDragging ? 999 : 'auto',
                                                            }}
                                                        >
                                                            <TaskCard
                                                                task={task}
                                                                onClick={onTaskClick}
                                                                isDragging={snapshot.isDragging}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {/* Empty column hint */}
                                            {colTasks.length === 0 && !snapshot.isDraggingOver && (
                                                <div className="flex flex-1 items-center justify-center py-8">
                                                    <p className="text-[11px] text-muted/50 text-center">
                                                        Letakkan tugas di sini
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
