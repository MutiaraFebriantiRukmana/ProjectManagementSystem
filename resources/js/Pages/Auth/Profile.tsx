import React from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
}

interface Props {
    auth: {
        user: User;
    };
}

export default function Profile({ auth }: Props) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">User Profile</h1>
            <p>Username: {auth?.user?.username}</p>
            <p>Email: {auth?.user?.email}</p>
        </div>
    );
}