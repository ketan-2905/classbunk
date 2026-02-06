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
    const [statView, setStatView] = useState('current');
    const [sidebarView, setSidebarView] = useState<'subjects' | 'bunk'>('subjects');

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
        // Optimistic load for speed
        loadData();
        // Background sync
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
                    <p className="text-zinc-500 animate-pulse">Verifying schedule...</p>
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
                {/* Analysis Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                    {['current', 'defaulter1', 'defaulter2', 'final'].map((key) => {
                        const labels: any = { current: 'Current Status', defaulter1: 'Defaulter List 1', defaulter2: 'Defaulter List 2', final: 'Final List' };
                        return (
                            <button
                                key={key}
                                onClick={() => setStatView(key)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${statView === key
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:bg-zinc-800'
                                    }`}
                            >
                                {labels[key]}
                            </button>
                        );
                    })}
                </div>

                {/* Range Specific Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Attendance % */}
                    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Attendance</div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-bold tracking-tight ${parseFloat(data?.ranges?.[statView]?.attendance || "0") >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {data?.ranges?.[statView]?.attendance}%
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
                                    {data?.ranges?.[statView]?.safeBunks}
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
                                    {data?.ranges?.[statView]?.toAttend}
                                </span>
                                <span className="text-zinc-600 text-xs">Lectures</span>
                            </div>
                        </div>
                    </div>
                    {/* Total (Context) */}
                    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total Scheduled</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-zinc-400">
                                    {data?.ranges?.[statView]?.totalConducted}
                                </span>
                                <span className="text-zinc-600 text-xs">Sessions</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Feed Logic */}
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

                    {/* Sidebar Area */}
                    <div className="space-y-4">

                        {/* Sidebar Tabs (Future Only) */}
                        {statView !== 'current' && (
                            <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setSidebarView('subjects')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${sidebarView === 'subjects' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Subject Analysis
                                </button>
                                <button
                                    onClick={() => setSidebarView('bunk')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${sidebarView === 'bunk' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Bunk Plan
                                </button>
                            </div>
                        )}

                        {/* Subject Analysis List */}
                        {(statView === 'current' || sidebarView === 'subjects') && (
                            <div className="space-y-2">
                                {statView === 'current' && (
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                                        <BookOpen className="w-5 h-5 text-indigo-400" /> Subject Analysis
                                    </h2>
                                )}

                                <div className={`glass-panel p-4 rounded-2xl space-y-2 border border-white/5 ${statView !== 'current' ? 'mt-0' : ''}`}>
                                    {data?.rangeSubjectStats?.[statView]?.map((subj: any) => {
                                        const pct = subj.percentage;
                                        const lag = subj.mustAttend;
                                        const isCritical = lag > 0;
                                        const isUnrecoverable = isCritical && statView !== 'current';

                                        return (
                                            <div key={`${subj.title}-${subj.type}`} className={`p-3 rounded-xl transition-all group border ${isCritical ? 'bg-rose-500/10 border-rose-500/30' : 'border-transparent hover:bg-white/5'}`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${subj.type === 'PR' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            {subj.type}
                                                        </span>
                                                        <span className="font-medium text-sm text-zinc-200 truncate pr-2">{subj.title}</span>
                                                    </div>
                                                    <span className={`text-xs font-bold ${pct >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {pct.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${Math.min(100, pct)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                                    <span>{subj.present}/{subj.total}</span>
                                                    {subj.safeBunks > 0 && <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">Safe: {subj.safeBunks}</span>}
                                                    {isCritical && (
                                                        <div className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded ${isUnrecoverable ? 'bg-rose-500 text-white shadow-lg animate-pulse' : 'bg-rose-500/20 text-rose-300'}`}>
                                                            <AlertTriangle className="w-3 h-3" />
                                                            <span>{isUnrecoverable ? `Short: ${lag}` : `Need: ${lag}`}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isUnrecoverable && (
                                                    <div className="mt-2 text-[10px] text-rose-200 bg-rose-500/20 p-2 rounded-lg border border-rose-500/20 flex items-start gap-2">
                                                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                                        <p className="leading-tight">
                                                            <strong>Impossible.</strong> Short by {lag} lectures even with 100% attendance.
                                                        </p>
                                                    </div>
                                                )}
                                                {isCritical && statView === 'current' && (
                                                    <div className="mt-2 text-[10px] text-rose-300/80 leading-tight pl-1 border-l-2 border-rose-500/30">
                                                        Attend next {lag} classes to recover.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Bunk Analysis (Condition: sidebarView === 'bunk') */}
                        {(sidebarView === 'bunk' && statView !== 'current') && (
                            data?.ranges?.[statView]?.bunkAnalysis && (
                                <div className="glass-panel p-4 rounded-xl border border-white/5 bg-emerald-500/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Bunk Opportunity
                                    </h3>

                                    {data.ranges[statView].bunkAnalysis.lectures > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Max Streak</div>
                                                <div className="font-bold text-white text-lg">{data.ranges[statView].bunkAnalysis.maxStreak} Lectures</div>
                                            </div>

                                            <div className="bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                                                <div className="px-3 py-2 border-b border-white/5 bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
                                                    <span>Target List</span>
                                                    <span className="text-emerald-400 font-mono">{new Date(data.ranges[statView].bunkAnalysis.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} ➜ {new Date(data.ranges[statView].bunkAnalysis.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700">
                                                    {data.ranges[statView].bunkAnalysis.streakDetails?.map((lec: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors text-xs group">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${lec.type === 'PR' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                                                                <span className="text-zinc-300 font-medium truncate max-w-[120px]">{lec.subject}</span>
                                                                <span className="text-[10px] text-zinc-600">({lec.type})</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-zinc-500 font-mono text-[10px]">
                                                                    {new Date(lec.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-xs text-emerald-400/80 leading-relaxed border-l-2 border-emerald-500/30 pl-2">
                                                Missing these {data.ranges[statView].bunkAnalysis.lectures} lectures consecutively keeps everyone above 75%.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2">
                                            <div className="text-xs text-zinc-500">No safe streaks available.</div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-sky-500/5">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-sky-400 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Analysis Mode</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Viewing stats projected for <strong>{statView.toUpperCase()}</strong>.
                                        "Total Scheduled" includes all future lectures up to this cutoff date.
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
