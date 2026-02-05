'use client';

import React, { useEffect, useState } from 'react';
import {
    RefreshCw, CheckCircle, XCircle, Clock,
    AlertTriangle, BookOpen, GraduationCap, Calendar, History, Info,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { getDashboardData, toggleAttendance } from '@/app/actions/dashboard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [view, setView] = useState<'today' | 'history'>('today');
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

    // ... loadData and useEffect (same as before) ...
    const loadData = async () => {
        try {
            const d = new Date();
            const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const res = await getDashboardData(todayStr);
            if (res.success) {
                setData(res.data);
            } else if (res.error === "User not found") {
                router.push('/auth/login');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const refreshDashboard = async () => {
        setSyncing(true);
        try {
            const syncRes = await fetch('/api/sync-schedule', { method: 'POST' });
            if (syncRes.status === 401) {
                router.push('/auth/login');
                return;
            }
            await loadData();
        } catch (e) {
            console.error("Refresh failed", e);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    const changeDate = (days: number) => {
        const date = new Date(historyDate);
        date.setDate(date.getDate() + days);
        setHistoryDate(date.toISOString().split('T')[0]);
    };

    const handleToggle = async (attendanceId: string, currentStatus: boolean, isHistory = false) => {
        const newData = { ...data };

        // Update in Schedule (if exists)
        if (newData.schedule) {
            const lecture = newData.schedule.find((s: any) => s.attendanceId === attendanceId);
            if (lecture) lecture.attended = !currentStatus;
        }

        // Update in History
        if (newData.history) {
            newData.history.forEach((d: any) => {
                const hLec = d.lectures.find((l: any) => l.attendanceId === attendanceId);
                if (hLec) hLec.attended = !currentStatus;
            });
        }

        setData(newData);
        await toggleAttendance(attendanceId, !currentStatus);
        await loadData();
    };

    if (loading) {
        // ... loading state ...
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-sky-500/30 border-t-sky-500 animate-spin" />
                    <p className="text-zinc-500 animate-pulse">Syncing with the void...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Dashboard</h1>
                    <p className="text-zinc-500 text-sm">Your attendance at a glance</p>
                </div>
                <button
                    onClick={refreshDashboard}
                    disabled={syncing}
                    className="p-2 rounded-full bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 text-sky-400 ${syncing ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Attendance % */}
                    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Attendance</div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-bold tracking-tight ${parseFloat(data?.stats?.attendance) >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {data?.stats?.attendance}%
                                </span>
                                <span className="text-zinc-600 text-xs">/ 75%</span>
                            </div>
                        </div>
                    </div>
                    {/* Safe Bunks */}
                    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Safe Bunks</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-emerald-400">
                                    {data?.stats?.safeBunks}
                                </span>
                                <span className="text-zinc-600 text-xs">Available</span>
                            </div>
                        </div>
                    </div>
                    {/* Must Attend */}
                    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Must Attend</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-white">
                                    {data?.stats?.toAttend}
                                </span>
                                <span className="text-zinc-600 text-xs">Lectures</span>
                            </div>
                        </div>
                    </div>
                    {/* Missed */}
                    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total Missed</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-zinc-400">
                                    {data?.stats?.totalMissed}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* View Switcher */}
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-1 rounded-xl w-fit border border-white/5">
                            <button
                                onClick={() => setView('today')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'today' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Today's Schedule
                            </button>
                            <button
                                onClick={() => setView('history')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'history' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Attendance History
                            </button>
                        </div>

                        {view === 'today' ? (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-sky-400" /> Today's Schedule
                                </h2>
                                {data?.schedule?.length === 0 ? (
                                    <div className="glass-panel p-8 rounded-2xl text-center text-zinc-500 border-dashed border-2 border-zinc-800">
                                        <h3 className="text-lg text-white mb-1">No lectures today</h3>
                                        <p>Enjoy your free time!</p>
                                    </div>
                                ) : (
                                    data?.schedule?.map((lecture: any) => (
                                        <LectureCard key={lecture.id} lecture={lecture} onToggle={handleToggle} />
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-4 glass-panel p-3 rounded-xl border border-white/5">
                                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <ChevronLeft className="w-5 h-5 text-zinc-400" />
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-purple-400" />
                                        <input
                                            type="date"
                                            value={historyDate}
                                            onChange={(e) => setHistoryDate(e.target.value)}
                                            className="bg-transparent border-none text-white font-medium focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert outline-none"
                                        />
                                    </div>

                                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <ChevronRight className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </div>

                                {(() => {
                                    const dayData = data?.history?.find((d: any) => d.date === historyDate);
                                    if (!dayData) {
                                        return (
                                            <div className="glass-panel p-8 rounded-2xl text-center text-zinc-500 border-dashed border-2 border-zinc-800">
                                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <h3 className="text-lg text-white mb-1">No records found</h3>
                                                <p>No lectures scheduled for this date.</p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium px-2 mb-2">
                                                <span className="capitalize">
                                                    {new Date(historyDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                </span>
                                            </div>
                                            {dayData.lectures.map((lecture: any) => (
                                                <LectureCard key={lecture.attendanceId} lecture={lecture} onToggle={(id: string, status: boolean) => handleToggle(id, status, true)} />
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Subject Analysis */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-400" /> Subject Analysis
                        </h2>
                        <div className="glass-panel p-4 rounded-2xl space-y-2 border border-white/5">
                            {data?.subjectStats?.map((subj: any) => {
                                const pct = subj.percentage;
                                return (
                                    <div key={subj.title} className="p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-sm text-zinc-200 truncate pr-2">{subj.title}</span>
                                            <span className={`text-xs font-bold ${pct >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {pct.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                                            <div
                                                className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                            <span>{subj.present}/{subj.total} attended</span>
                                            {subj.safeBunks > 0 && (
                                                <span className="text-emerald-400 font-medium">Safe Bunks: {subj.safeBunks}</span>
                                            )}
                                            {subj.mustAttend > 0 && (
                                                <span className="text-rose-400 font-medium">Must Attend: {subj.mustAttend}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-sky-500/5">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-sky-400 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">How is this calculated?</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Calculations assume a strictly enforced <strong>75% attendance requirement</strong>.
                                        "Safe Bunks" estimates lectures you can skip while staying above 75%.
                                        "Must Attend" shows how many consecutive lectures you need to recover to 75%.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LectureCard({ lecture, onToggle }: { lecture: any, onToggle: any }) {
    return (
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
                    ${lecture.type === 'PR' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}
                `}>
                    {lecture.type || 'L'}
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm lg:text-base">{lecture.subject}</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lecture.time}</span>
                        <span className="hidden lg:inline">•</span>
                        <span className="hidden lg:inline">{lecture.room || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={() => onToggle(lecture.attendanceId, lecture.attended)}
                className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all flex items-center gap-2
                    ${lecture.attended
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20'
                        : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/20'
                    }
                `}
            >
                {lecture.attended ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="hidden lg:inline">{lecture.attended ? "Attended" : "Missed"}</span>
            </button>
        </div>
    );
}
