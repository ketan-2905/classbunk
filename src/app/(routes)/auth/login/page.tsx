'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            identifier: '',
            password: '',
        },
    });

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setServerError('');

        const res = await loginUser(data);

        if (res.success) {
            router.push('/dashboard');
        } else {
            setServerError(res.error || 'Invalid credentials');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/50 border border-white/5 mb-4">
                    <LogIn className="w-6 h-6 text-sky-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                <p className="text-zinc-500 text-sm">Enter the void. Track your attendance.</p>
            </div>

            {/* Glass Form Card */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    {serverError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {serverError}
                        </div>
                    )}

                    {/* Identifier Field (Email or SAP ID) */}
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Email or SAP ID</label>
                        <input
                            type="text"
                            {...register('identifier', {
                                required: 'Email or SAP ID is required'
                            })}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                            placeholder="std@college.edu or 6000..."
                        />
                        {errors.identifier && <p className="text-xs text-red-400 ml-1">{errors.identifier.message}</p>}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5 relative">
                        <div className="flex justify-between items-center">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Password</label>
                            <Link href="#" className="text-xs text-sky-400 hover:text-sky-300">Forgot?</Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register('password', { required: 'Password is required' })}
                                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>

                </form>
            </div>

            <p className="text-center text-zinc-500 text-sm">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
                    Create one
                </Link>
            </p>
        </div>
    );
}
