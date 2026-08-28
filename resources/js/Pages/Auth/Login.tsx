import React, { FormEventHandler } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { LogIn, Mail, Lock, AlertCircle, Loader2, LayoutDashboard } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-0 px-4">
            <Head title="Masuk ke Akun" />

            {/* Background decorative elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary-dark/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo / Branding */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20">
                        <LayoutDashboard className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Project Management
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Masuk ke akun Anda untuk melanjutkan
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Global/Email Error */}
                        {errors.email && (
                            <div className="flex items-start gap-3 rounded-xl bg-error/10 border border-error/20 px-4 py-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                                <p className="text-sm text-error">{errors.email}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    required
                                    autoComplete="email"
                                    className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    <span>Masuk</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Project Management System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}