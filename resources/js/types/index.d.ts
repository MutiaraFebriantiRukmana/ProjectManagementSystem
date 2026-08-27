export interface User {
    id: number;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    created_at?: string;
    is_active?: boolean;
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
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
};
