'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function getDashboardData(clientDateStr?: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) return { success: false, error: "Unauthorized" };

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

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

        if (!user) return { success: false, error: "User not found" };

        console.log("DEBUG: User Context", {
            id: user.id,
            branch: user.branchId,
            divisionName: user.division.name,
            divisionId: user.divisionId,
            batch: user.subDivisionId,
            totalAttendances: user.attendances.length
        });

        // Calculate Stats
        // 1. Total Conducted (Status is not 'CANCELLED', Date <= Today (approx))
        const now = new Date();
        const attended = user.attendances.filter(a => a.attended).length;
        const total = user.attendances.length;
        const missed = total - attended;
        const percentage = total > 0 ? ((attended / total) * 100) : 100;

        // Safe Bunks Calculation (Target 75%)
        // Formula: (Present) / (Total + X) >= 0.75
        // Present >= 0.75 * (Total + X)
        // Present >= 0.75 * Total + 0.75 * X
        // Present - 0.75 * Total >= 0.75 * X
        // (Present - 0.75 * Total) / 0.75 >= X
        // Function: margin = (Present / 0.75) - Total
        // If margin is positive, you can miss 'margin' lectures.

        const margin = Math.floor((attended / 0.75) - total);
        const safeBunks = margin > 0 ? margin : 0;

        // Lectures to Attend (if < 75%)
        // (Present + X) / (Total + X) >= 0.75
        // Present + X >= 0.75 * Total + 0.75 * X
        // 0.25 * X >= 0.75 * Total - Present
        // X >= (0.75 * Total - Present) / 0.25
        // X >= 3 * Total - 4 * Present (simplified algebra check?)
        // Let's use simpler: TotalNeeded = Present / 0.75  -> This is wrong if catching up.
        // Sol for X: X >= (3*Total - 4*Present)
        const deficit = Math.ceil(3 * total - 4 * attended);
        const toAttend = deficit > 0 ? deficit : 0;

        // Group by Subject for detailed breakdown
        const rawSubjectStats: Record<string, { total: number, present: number, title: string }> = {};
        user.attendances.forEach(a => {
            const subj = a.lectureInstance.lectureTemplate.subject;
            if (!rawSubjectStats[subj]) rawSubjectStats[subj] = { total: 0, present: 0, title: subj };
            rawSubjectStats[subj].total++;
            if (a.attended) rawSubjectStats[subj].present++;
        });

        const subjectStats = Object.values(rawSubjectStats).map(stat => {
            const margin = Math.floor((stat.present / 0.75) - stat.total);
            const safeBunks = margin > 0 ? margin : 0;
            const deficit = Math.ceil(3 * stat.total - 4 * stat.present);
            const mustAttend = deficit > 0 ? deficit : 0;
            const percentage = stat.total > 0 ? ((stat.present / stat.total) * 100) : 100;

            return {
                ...stat,
                safeBunks,
                mustAttend,
                percentage
            };
        });

        // Get Today's Schedule (Normalized to local/UTC day match)
        // We'll return the raw ISO strings and let client handle "Today" filtering or do it here approximately
        // Best to just return "Upcoming/Today" separate list
        // Filter attendances where date is today
        // Use the calculated startOfDay from clientDateStr (or fallback)
        const todayStr = startOfDay.toISOString().split('T')[0];
        const todaysLectures = user.attendances.filter(a => {
            const lectureDate = new Date(a.lectureInstance.date).toISOString().split('T')[0];
            return lectureDate === todayStr;
        }).map(a => ({
            id: a.lectureInstanceId,
            subject: a.lectureInstance.lectureTemplate.subject,
            type: a.lectureInstance.lectureTemplate.lectureType,
            time: `${a.lectureInstance.lectureTemplate.startTime} - ${a.lectureInstance.lectureTemplate.endTime}`,
            room: a.lectureInstance.lectureTemplate.room,
            attended: a.attended, // Current status
            faculty: a.lectureInstance.lectureTemplate.faculty,
            attendanceId: a.id
        }));

        // History Grouping (Past Dates)
        const historyMap: Record<string, any[]> = {};
        // Sort by Date Descending
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
            lectures: historyMap[date]
        }));

        return {
            success: true,
            data: {
                stats: {
                    attendance: percentage.toFixed(1),
                    safeBunks,
                    toAttend,
                    totalMissed: missed,
                    totalConducted: total
                },
                subjectStats: subjectStats,
                schedule: todaysLectures,
                history: history
            }
        };

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return { success: false, error: "Failed to fetch data" };
    }
}

export async function toggleAttendance(attendanceId: string, status: boolean) {
    try {
        await prisma.attendance.update({
            where: { id: attendanceId },
            data: { attended: status }
        });
        return { success: true };
    } catch (error) {
        console.error("Toggle Error", error);
        return { success: false };
    }
}
