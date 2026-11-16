import React, { useState, useEffect } from 'react';
import { Bell, Check, CircleAlert } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface AppNotification {
    id: string;
    data: {
        title: string;
        message: string;
        task_id?: number;
        project_id?: number;
    };
    read_at: string | null;
    created_at: string;
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Ambil data notifikasi dari backend
    useEffect(() => {
        axios.get('/notifications').then((res) => {
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        });
    }, []);

    const markAsRead = (id: string) => {
        axios.patch(`/notifications/${id}/read`).then(() => {
            setNotifications(notifications.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        });
    };

    const markAllAsRead = () => {
        router.post('/notifications/read-all', {}, {
            onSuccess: () => {
                setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
                setUnreadCount(0);
                setIsOpen(false);
            }
        });
    };

    // FUNGSI BARU: Tangani klik notifikasi (Tandai dibaca + Pindah Halaman)
    const handleNotificationClick = (notif: AppNotification) => {
        // 1. Tandai dibaca jika belum
        if (!notif.read_at) {
            markAsRead(notif.id);
        }
        
        // 2. Tutup dropdown notifikasi
        setIsOpen(false);
        
        // 3. Arahkan ke halaman project
        if (notif.data.project_id) {
            router.visit(`/projects/${notif.data.project_id}`);
        }
    };

    return (
        <div className="relative">
            {/* Ikon Lonceng */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-surface-2 transition-colors text-muted hover:text-foreground"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-surface-1">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Popup List Notifikasi */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 z-50 rounded-xl border border-border bg-surface-1 shadow-2xl glass overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between border-b border-border bg-surface-2/50 px-4 py-3">
                            <h3 className="font-semibold text-foreground text-sm">Notifikasi</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                                    Tandai semua dibaca
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-sm text-muted">
                                    <CircleAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    Belum ada notifikasi baru
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            // UBAH BAGIAN INI: Tambah cursor-pointer dan fungsi handleNotificationClick
                                            className={`p-4 transition-colors hover:bg-surface-2 cursor-pointer ${!notif.read_at ? 'bg-primary/5' : ''}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className="flex justify-between gap-2">
                                                <h4 className={`text-sm ${!notif.read_at ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                    {notif.data.title}
                                                </h4>
                                                {!notif.read_at && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                                            </div>
                                            <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-3">
                                                {notif.data.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}