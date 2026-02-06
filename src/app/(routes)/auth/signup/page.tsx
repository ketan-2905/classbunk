'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, ChevronRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBranches, getDivisions } from '@/app/actions/data';
import { registerUser } from '@/app/actions/auth';

// Data Interfaces
interface Item {
    id: string;
    name: string;
}

export default function SignupPage() {
    const router = useRouter();
    const [branches, setBranches] = useState<Item[]>([]);
    const [divisions, setDivisions] = useState<Item[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [electives, setElectives] = useState<{ slot1: string[], slot2: string[] }>({ slot1: [], slot2: [] });

    // Form Setup
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            branchId: '',
            divisionId: '',
            semester: '',
            sapId: '',
            rollNo: '',
            subDivisionId: '',
            electiveChoice1: '',
            electiveChoice2: ''
        },
    });

    const selectedBranchId = watch('branchId');
    const selectedSemester = watch('semester');

    // Fetch Electives
    useEffect(() => {
        if (selectedBranchId && selectedSemester) {
            const fetchElectives = async () => {
                try {
                    const res = await fetch(`/api/electives?branchId=${selectedBranchId}&semester=${selectedSemester}`);
                    const json = await res.json();
                    if (json.success) {
                        setElectives(json.data);
                    } else {
                        setElectives({ slot1: [], slot2: [] });
                    }
                } catch (e) { console.error(e); }
            };
            fetchElectives();
        } else {
            setElectives({ slot1: [], slot2: [] });
        }
    }, [selectedBranchId, selectedSemester]);

    // Fetch Branches on Mount
    useEffect(() => {
        const fetchData = async () => {
            const res = await getBranches();
            if (res.success) {
                setBranches(res.data);
            }
            setLoadingConfig(false);
        };
        fetchData();
    }, []);

    // Fetch Divisions when Branch changes
    useEffect(() => {
        if (selectedBranchId) {
            const fetchDiv = async () => {
                const res = await getDivisions(selectedBranchId);
                if (res.success) {
                    setDivisions(res.data);
                }
            };
            fetchDiv();
        } else {
            setDivisions([]);
        }
    }, [selectedBranchId]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setServerError('');

        // Basic validation for numbers if needed, but strings are fine
        const res = await registerUser(data);

        if (res.success) {
            router.push('/dashboard');
        } else {
            setServerError(res.error || 'Something went wrong');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/50 border border-white/5 mb-4">
                    <GraduationCap className="w-6 h-6 text-sky-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
                <p className="text-zinc-500 text-sm">Join ClassBunk to track your attendance</p>
            </div>

            {/* Glass Form Card */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    {serverError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {serverError}
                        </div>
                    )}

                    {/* Name Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Full Name</label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="text-xs text-red-400 ml-1">{errors.name.message}</p>}
                    </div>

                    {/* SAP ID & Roll No Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">SAP ID</label>
                            <input
                                {...register('sapId', { required: 'SAP ID is required' })}
                                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                placeholder="6000..."
                            />
                            {errors.sapId && <p className="text-xs text-red-400 ml-1">{errors.sapId.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Roll No</label>
                            <input
                                {...register('rollNo', { required: 'Required' })}
                                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                placeholder="A001"
                            />
                            {errors.rollNo && <p className="text-xs text-red-400 ml-1">{errors.rollNo.message}</p>}
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Email Address</label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                            placeholder="std@college.edu"
                        />
                        {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5 relative">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Must be at least 6 chars' } })}
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

                    {/* Branch & Division Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Branch</label>
                            <div className="relative">
                                <select
                                    {...register('branchId', { required: 'Required' })}
                                    className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                >
                                    <option value="" className="bg-zinc-900 text-zinc-500">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} className="bg-zinc-900">{b.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                            {errors.branchId && <p className="text-xs text-red-400 ml-1">{errors.branchId.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Division</label>
                            <div className="relative">
                                <select
                                    {...register('divisionId', { required: 'Required' })}
                                    className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                    disabled={!selectedBranchId}
                                >
                                    <option value="" className="bg-zinc-900 text-zinc-500">Select Div</option>
                                    {divisions.map(d => (
                                        <option key={d.id} value={d.id} className="bg-zinc-900">{d.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                            {errors.divisionId && <p className="text-xs text-red-400 ml-1">{errors.divisionId.message}</p>}
                        </div>
                    </div>

                    {/* Semester & Subdivision Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Semester</label>
                            <div className="relative">
                                <select
                                    {...register('semester', { required: 'Required' })}
                                    className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                >
                                    <option value="" className="bg-zinc-900 text-zinc-500">Select Sem</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s} className="bg-zinc-900">Semester {s}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                            {errors.semester && <p className="text-xs text-red-400 ml-1">{errors.semester.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Sub-Division (Batch)</label>
                            <div className="relative">
                                <select
                                    {...register('subDivisionId', { required: 'Required' })}
                                    className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                >
                                    <option value="" className="bg-zinc-900 text-zinc-500">Select Batch</option>
                                    <option value="1" className="bg-zinc-900">Batch 1 (e.g. D11)</option>
                                    <option value="2" className="bg-zinc-900">Batch 2 (e.g. D12)</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                            {errors.subDivisionId && <p className="text-xs text-red-400 ml-1">{errors.subDivisionId.message}</p>}
                        </div>
                    </div>

                    {/* Electives Row (Dynamic) */}
                    {(electives.slot1.length > 0 || electives.slot2.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {electives.slot1.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Elective I</label>
                                    <div className="relative">
                                        <select
                                            {...register('electiveChoice1', { required: 'Elective 1 Required' })}
                                            className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                        >
                                            <option value="" className="bg-zinc-900 text-zinc-500">Select Subject</option>
                                            {electives.slot1.map((s, i) => (
                                                <option key={i} value={s} className="bg-zinc-900">{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                    {errors.electiveChoice1 && <p className="text-xs text-red-400 ml-1">{errors.electiveChoice1.message as string}</p>}
                                </div>
                            )}

                            {electives.slot2.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Elective II</label>
                                    <div className="relative">
                                        <select
                                            {...register('electiveChoice2', { required: 'Elective 2 Required' })}
                                            className="w-full appearance-none bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
                                        >
                                            <option value="" className="bg-zinc-900 text-zinc-500">Select Subject</option>
                                            {electives.slot2.map((s, i) => (
                                                <option key={i} value={s} className="bg-zinc-900">{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                    {errors.electiveChoice2 && <p className="text-xs text-red-400 ml-1">{errors.electiveChoice2.message as string}</p>}
                                </div>
                            )}
                        </div>
                    )}


                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Creating...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>

                </form>
            </div>

            <p className="text-center text-zinc-500 text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
                    Log in
                </Link>
            </p>
        </div>
    );
}
