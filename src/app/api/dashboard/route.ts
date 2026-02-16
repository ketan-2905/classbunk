import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { calculateProjectedTotal, getProjectedSchedule } from '@/lib/stats-calculator';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        // Get Query Params
        const { searchParams } = new URL(request.url);
        const clientDateStr = searchParams.get('date');

        // Determine "Today" (Normalized to UTC Midnight)
        let startOfDay: Date;
        if (clientDateStr) {
            const [y, m, d] = clientDateStr.split('-').map(Number);
            startOfDay = new Date(Date.UTC(y, m - 1, d));
        } else {
            const today = new Date();
            startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                division: true,
                attendances: {
                    include: {
                        lectureInstance: {
                            include: {
                                lectureTemplate: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        // --- Multi-Range Stats Calculation ---

        const semStartDate = new Date(Date.UTC(2026, 0, 27)); // Jan 27
        const ranges = {
            current: { end: startOfDay, label: 'Current' },
            defaulter1: { end: new Date(Date.UTC(2026, 2, 2)), label: 'Defaulter 1' }, // Mar 2
            defaulter2: { end: new Date(Date.UTC(2026, 3, 2)), label: 'Defaulter 2' }, // Apr 2
            final: { end: new Date(Date.UTC(2026, 4, 15)), label: 'Final' } // May 15
        };

        // 1. Calculate Baseline (Current) Totals for "Conducted So Far" logic
        const currentProjectedTotals = await calculateProjectedTotal(user.id, semStartDate, ranges.current.end);

        const responseStats: Record<string, any> = {};
        const responseSubjectStats: Record<string, any> = {};

        // Helper to formatting stats
        const computeStats = (totals: any, targetDate: Date, isCurrent: boolean) => {
            let overallTotal = 0;         // Range Project Total
            let overallAttended = 0;      // Actual Present (DB)
            let overallConductedSoFar = 0; // Baseline Total (Current)

            // 1. Calculate Adjustments (Extra/Ignored) per Subject
            const adjustments: Record<string, number> = {};

            // Exceptions logic:
            // isIgnored: Remove from Total.
            // isExtra: Add to Total.

            // Limit exceptions to targetDate
            const relevantExceptions = user.attendances.filter(a => {
                const d = new Date(a.lectureInstance.date);
                // Check subject existence to define key, although user.attendances should have it included
                return d <= targetDate && (a.isIgnored || a.isExtra);
            });

            relevantExceptions.forEach(a => {
                const key = `${a.lectureInstance.lectureTemplate.subject}-${a.lectureInstance.lectureTemplate.lectureType}`;
                if (!adjustments[key]) adjustments[key] = 0;

                if (a.isIgnored) adjustments[key]--;
                if (a.isExtra) adjustments[key]++;
            });

            const subjects = Object.entries(totals).map(([key, info]: [string, any]) => {
                // Actual attendance (Filtered by !isIgnored)
                const attendedCount = user.attendances.filter(a => {
                    const d = new Date(a.lectureInstance.date);
                    const subj = a.lectureInstance.lectureTemplate.subject;
                    const type = a.lectureInstance.lectureTemplate.lectureType;

                    return d <= startOfDay &&   // ALWAYS use TODAY as limit for "Actuals"
                        !a.isIgnored &&         // EXCLUDE Ignored
                        subj === info.title &&
                        type === info.type &&
                        a.attended;

                }).length;

                // Adjust Totals
                const adjustment = adjustments[key] || 0;
                const adjustedTotal = Math.max(0, info.total + adjustment);

                overallTotal += adjustedTotal;
                overallAttended += attendedCount;

                // ConductedSoFar Adjustment (Past/Current only)
                const currentInfo = currentProjectedTotals[key];

                const pastExceptions = user.attendances.filter(a => {
                    const d = new Date(a.lectureInstance.date);
                    const k = `${a.lectureInstance.lectureTemplate.subject}-${a.lectureInstance.lectureTemplate.lectureType}`;
                    return d <= startOfDay && k === key && (a.isIgnored || a.isExtra);
                });
                let pastAdj = 0;
                pastExceptions.forEach(a => {
                    if (a.isIgnored) pastAdj--;
                    if (a.isExtra) pastAdj++;
                });

                const baseConducted = currentInfo ? currentInfo.total : 0;
                const conductedSoFar = Math.max(0, baseConducted + pastAdj);
                overallConductedSoFar += conductedSoFar;

                // Stats Calculation
                let safeBunks = 0;
                let mustAttend = 0;
                let percentage = 100;

                if (isCurrent) {
                    // Standard "Current Status" Logic
                    const margin = Math.floor((attendedCount / 0.75) - adjustedTotal);

                    const required = Math.ceil(0.75 * adjustedTotal);
                    const deficit = required - attendedCount;

                    safeBunks = margin > 0 ? margin : 0;
                    mustAttend = deficit > 0 ? deficit : 0;
                    // % of Conducted (Adjusted)
                    percentage = adjustedTotal > 0 ? ((attendedCount / adjustedTotal) * 100) : 100;
                } else {
                    // Future "Assumption" Logic
                    const remaining = Math.max(0, adjustedTotal - conductedSoFar);
                    const maxPossiblePresent = attendedCount + remaining;
                    const requiredFor75 = Math.ceil(0.75 * adjustedTotal);

                    const safetyMargin = maxPossiblePresent - requiredFor75;

                    safeBunks = safetyMargin > 0 ? safetyMargin : 0;

                    mustAttend = safetyMargin < 0 ? -safetyMargin : 0;

                    // Percentage to show: Users usually want "Current Real Rate"
                    const denom = conductedSoFar > 0 ? conductedSoFar : 1;
                    percentage = (attendedCount / denom) * 100;
                }

                return {
                    title: info.title,
                    type: info.type,
                    total: adjustedTotal,
                    present: attendedCount,
                    percentage,
                    safeBunks,
                    mustAttend
                };
            });

            // Overall Stats
            let totalSafe = 0;
            let totalToAttend = 0;
            let totalPercentage = "0.0";

            if (isCurrent) {
                const margin = Math.floor((overallAttended / 0.75) - overallTotal);
                // Updated Deficit Logic (Shortfall)
                const required = Math.ceil(0.75 * overallTotal);
                const deficit = required - overallAttended;

                totalSafe = margin > 0 ? margin : 0;
                totalToAttend = deficit > 0 ? deficit : 0;
                totalPercentage = overallTotal > 0 ? ((overallAttended / overallTotal) * 100).toFixed(1) : "100.0";
            } else {
                const remaining = Math.max(0, overallTotal - overallConductedSoFar);
                const maxPossible = overallAttended + remaining;
                const required = Math.ceil(0.75 * overallTotal);
                const safetyMargin = maxPossible - required;

                totalSafe = safetyMargin > 0 ? safetyMargin : 0;
                totalToAttend = safetyMargin < 0 ? -safetyMargin : 0;

                const denom = overallConductedSoFar > 0 ? overallConductedSoFar : 1;
                totalPercentage = ((overallAttended / denom) * 100).toFixed(1);
            }

            return {
                stats: {
                    attendance: totalPercentage,
                    safeBunks: totalSafe,
                    toAttend: totalToAttend,
                    totalMissed: overallConductedSoFar - overallAttended, // Missed so far
                    totalConducted: overallTotal // Range Projected Total
                },
                subjects
            };
        };

        // Calculate for each range
        for (const [key, range] of Object.entries(ranges)) {
            const isCurrent = key === 'current';
            const projectedTotals = isCurrent
                ? currentProjectedTotals
                : await calculateProjectedTotal(user.id, semStartDate, range.end);
            // const projectedTotals = key === "Defaulter 1" ? await calculateProjectedTotal(user.id, semStartDate, range.end)
            //     : key === "Defaulter 2" ? await calculateProjectedTotal(user.id, ranges.defaulter1.end, range.end)
            //     : key === "Final" ? await calculateProjectedTotal(user.id, semStartDate, range.end)
            //     : currentProjectedTotals;

            const computed = computeStats(projectedTotals, range.end, isCurrent);
            responseStats[key] = computed.stats;
            responseSubjectStats[key] = computed.subjects;

            // Bunk Analysis (Max Continuous Bunk Streak)
            const bunkAnalysis: any = { maxStreak: 0, startDate: null, endDate: null, lectures: 0 };

            if (!isCurrent) {
                // 1. Calculate Available Budgets (how many I can safe-bunk)
                const subjectBudgets: Record<string, number> = {};
                computed.subjects.forEach((s: any) => {
                    const k = `${s.title}-${s.type}`;
                    subjectBudgets[k] = s.safeBunks;
                });

                // 2. Get Future Schedule
                const tomorrow = new Date(startOfDay);
                tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

                if (tomorrow < range.end) {
                    const schedule = await getProjectedSchedule(user.id, tomorrow, range.end);

                    // 3. Sliding Window for Max Streak
                    let left = 0;
                    const currentUsage: Record<string, number> = {};

                    for (let right = 0; right < schedule.length; right++) {
                        const lec = schedule[right];
                        const k = `${lec.subject}-${lec.type}`;
                        currentUsage[k] = (currentUsage[k] || 0) + 1;

                        // Shrink if invalid (budget exceeded)
                        while (currentUsage[k] > (subjectBudgets[k] || 0)) {
                            const removeLec = schedule[left];
                            const removeK = `${removeLec.subject}-${removeLec.type}`;
                            currentUsage[removeK]--;
                            left++;
                        }

                        // Valid Window
                        const streakSize = right - left + 1;
                        if (streakSize > bunkAnalysis.lectures) {
                            bunkAnalysis.lectures = streakSize;
                            bunkAnalysis.maxStreak = streakSize;
                            bunkAnalysis.startDate = schedule[left].date;
                            bunkAnalysis.endDate = schedule[right].date;
                            bunkAnalysis.streakDetails = schedule.slice(left, right + 1).map(l => ({
                                subject: l.subject,
                                type: l.type,
                                date: l.date,
                                time: l.startTime
                            }));
                        }
                    }
                }
            }
            // Attach to stats
            responseStats[key].bunkAnalysis = bunkAnalysis;
        }


        // --- Schedule & History (Standard) ---

        // Today's Schedule
        const todayStr = startOfDay.toISOString().split('T')[0];
        const todaysLectures = user.attendances.filter(a => {
            const lectureDate = new Date(a.lectureInstance.date).toISOString().split('T')[0];
            return lectureDate === todayStr;
        })
            .sort((a, b) => a.lectureInstance.lectureTemplate.startTime.localeCompare(b.lectureInstance.lectureTemplate.startTime))
            .map(a => ({
                id: a.lectureInstanceId,
                subject: a.lectureInstance.lectureTemplate.subject,
                type: a.lectureInstance.lectureTemplate.lectureType,
                time: `${a.lectureInstance.lectureTemplate.startTime} - ${a.lectureInstance.lectureTemplate.endTime}`,
                room: a.lectureInstance.lectureTemplate.room,
                attended: a.attended,
                faculty: a.lectureInstance.lectureTemplate.faculty,
                attendanceId: a.id
            }));

        // History
        const historyMap: Record<string, any[]> = {};
        user.attendances.sort((a, b) => new Date(b.lectureInstance.date).getTime() - new Date(a.lectureInstance.date).getTime());

        user.attendances.forEach(a => {
            const d = new Date(a.lectureInstance.date).toISOString().split('T')[0];
            if (!historyMap[d]) historyMap[d] = [];
            historyMap[d].push({
                attendanceId: a.id,
                subject: a.lectureInstance.lectureTemplate.subject,
                type: a.lectureInstance.lectureTemplate.lectureType,
                time: `${a.lectureInstance.lectureTemplate.startTime} - ${a.lectureInstance.lectureTemplate.endTime}`,
                room: a.lectureInstance.lectureTemplate.room,
                attended: a.attended
            });
        });

        const history = Object.keys(historyMap).sort((a, b) => b.localeCompare(a)).map(date => ({
            date,
            lectures: historyMap[date].sort((a: any, b: any) => a.time.localeCompare(b.time))
        }));

        // Send 'current' as default but include others
        return NextResponse.json({
            success: true,
            data: {
                // Default View (Current)
                stats: responseStats.current,
                subjectStats: responseSubjectStats.current,

                // All Ranges
                ranges: responseStats,
                rangeSubjectStats: responseSubjectStats,

                schedule: todaysLectures,
                history: history
            }
        });

    } catch (error) {
        console.error("Dashboard Data API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
    }
}
