import React from 'react';

interface Project {
    id: number;
    name: string;
    description?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

interface Props {
    project: Project;
}

export default function Show({ project }: Props) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">{project?.name}</h1>
        </div>
    );
}