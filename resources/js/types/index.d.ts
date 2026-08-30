export interface User {
    id: number;
    username: string;
    email: string;
    roles: any[];
    permissions: string[];
    is_active?: boolean;
}

export interface Label {
    id: number;
    name: string;
    color: string;
}

export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    comment: string;
    created_at: string;
    user?: User;
}

export interface TaskAttachment {
    id: number;
    task_id: number;
    user_id: number;
    filename: string;
    filepath: string;
    filesize: number;
    filetype: string;
    created_at: string;
}

export interface Task {
    id: number;
    project_id: number;
    parent_id?: number | null;
    reporter_id: number;
    title: string;
    description?: string | null;
    status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    start_date?: string | null;
    end_date?: string | null;
    requires_approval: boolean;
    position: number;
    assignees?: User[];
    labels?: Label[];
    dependencies?: Task[];
    subtasks?: Task[];
    attachments?: TaskAttachment[];
    comments?: Comment[];
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    start_date: string;
    end_date: string;
    manager_id: number;
    manager?: User;
    members?: User[];
    tasks?: Task[];
    created_at?: string;
    updated_at?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
    flash: {
        success?: string;
        error?: string;
    };
};
// Ziggy global route helper type declaration
declare function route(): { current(name: string): boolean };
declare function route(name: string, params?: Record<string, any>): string;
