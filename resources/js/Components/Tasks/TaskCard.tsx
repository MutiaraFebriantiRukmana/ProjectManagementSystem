import React from 'react';
import { Task, User } from '@/types';
import {
    AlertTriangle,
    Flame,
    ArrowUp,
    Minus,
    ArrowDown,
    MessageSquare,
    Paperclip,
    Calendar,
    Clock,
} from 'lucide-react';

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
    critical: {
        label: 'Critical',
        Icon: Flame,
        textColor: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/25',
    },
    high: {
        label: 'High',
        Icon: ArrowUp,
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        borderColor: 'border-orange-400/25',
    },
    medium: {
        label: 'Medium',
        Icon: Minus,
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400/25',
    },
    low: {
        label: 'Low',
        Icon: ArrowDown,
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-400/10',
        borderColor: 'border-slate-400/25',
    },
};

// ─── Deadline helper ─────────────────────────────────────────────────────────
function getDeadlineInfo(endDate: string) {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d late`, cls: 'text-red-400', Icon: AlertTriangle };
    if (diffDays === 0) return { label: 'Due today', cls: 'text-orange-400', Icon: Clock };
    if (diffDays <= 3) return { label: `${diffDays}d left`, cls: 'text-orange-400', Icon: Clock };
    if (diffDays <= 7) return { label: `${diffDays}d left`, cls: 'text-yellow-400', Icon: Calendar };
    return { label: `${diffDays}d left`, cls: 'text-slate-400', Icon: Calendar };
}

// ─── Assignee Avatar Stack ───────────────────────────────────────────────────
function AvatarStack({ assignees }: { assignees: User[] }) {
    const max = 3;
    const visible = assignees.slice(0, max);
    const extra = assignees.length - max;
    return (
        <div className="flex -space-x-2">
            {visible.map((a) => (
                <div
                    key={a.id}
                    title={a.username}
                    className="h-6 w-6 rounded-full bg-primary/20 border-2 border-surface-1 flex items-center justify-center text-[10px] font-bold text-primary shrink-0"
                >
                    {a.username?.charAt(0).toUpperCase()}
                </div>
            ))}
            {extra > 0 && (
                <div className="h-6 w-6 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
                    +{extra}
                </div>
            )}
        </div>
    );
}

// ─── Task Card ───────────────────────────────────────────────────────────────
interface TaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
    isDragging?: boolean;
}

export default function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
    const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
    const PriorityIcon = priority.Icon;

    const blockedDeps = (task.dependencies ?? []).filter((d) => d.status !== 'done');
    const isBlocked = blockedDeps.length > 0;

    const deadlineInfo = task.end_date ? getDeadlineInfo(task.end_date) : null;
    const DeadlineIcon = deadlineInfo?.Icon ?? Calendar;

    const commentCount = task.comments?.length ?? 0;
    const attachmentCount = task.attachments?.length ?? 0;

    return (
        <div
            onClick={() => onClick(task)}
            className={`
                glass-card p-4 cursor-pointer select-none
                transition-all duration-300
                hover:border-white/10
                hover:shadow-[0_0_24px_rgba(252,165,193,0.08)]
                ${isDragging
                    ? 'shadow-[0_8px_32px_rgba(252,165,193,0.18)] border-white/15 scale-105 rotate-2 z-[999] opacity-95 backdrop-blur-3xl'
                    : ''
                }
            `}
        >
            {/* Blocked Alert */}
            {isBlocked && (
                <div className="mb-2.5 flex items-center gap-1.5 rounded-lg bg-orange-400/10 border border-orange-400/20 px-2.5 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span className="text-[11px] font-medium text-orange-400 leading-tight">
                        Blocked by: {blockedDeps.map((d) => d.title).join(', ')}
                    </span>
                </div>
            )}

            {/* Priority + Labels Row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${priority.textColor} ${priority.bgColor} ${priority.borderColor}`}
                >
                    <PriorityIcon className="h-3 w-3" />
                    {priority.label}
                </span>

                {(task.labels ?? []).map((label) => (
                    <span
                        key={label.id}
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border"
                        style={{
                            backgroundColor: `${label.color}18`,
                            color: label.color,
                            borderColor: `${label.color}35`,
                        }}
                    >
                        {label.name}
                    </span>
                ))}
            </div>

            {/* Task Title */}
            <h4 className="text-sm font-semibold text-foreground leading-snug mb-3 line-clamp-2">
                {task.title}
            </h4>

            {/* Footer Row */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-muted">
                    {/* Deadline */}
                    {deadlineInfo && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${deadlineInfo.cls}`}>
                            <DeadlineIcon className="h-3 w-3" />
                            {deadlineInfo.label}
                        </span>
                    )}

                    {/* Comment count */}
                    {commentCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                            <MessageSquare className="h-3 w-3" />
                            {commentCount}
                        </span>
                    )}

                    {/* Attachment count */}
                    {attachmentCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                            <Paperclip className="h-3 w-3" />
                            {attachmentCount}
                        </span>
                    )}
                </div>

                {/* Assignee Avatars */}
                {(task.assignees ?? []).length > 0 && (
                    <AvatarStack assignees={task.assignees!} />
                )}
            </div>
        </div>
    );
}
