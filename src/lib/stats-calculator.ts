import prisma from '@/lib/prisma';
import { LectureTemplate, LectureType } from '@/generated/prisma/client';

function jsDayToDbDay(jsDay: number): number {
    if (jsDay === 0) return 7;
    return jsDay;
}

export async function calculateProjectedTotal(userId: string, startDate: Date, endDate: Date) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const formatDateKey = (d: Date) => d.toISOString().split('T')[0];

    // Holidays
    const calendar = await prisma.academicCalendar.findFirst({ where: { year: "2025 - 2026" } });
    const holidays = new Set<string>();
    if (calendar && calendar.data) {
        const data = calendar.data as any;
        data.academicCalendar.months.forEach((m: any) => {
            m.events.forEach((e: any) => {
                if (e.type === "Holiday" || e.day === "Sunday") {
                    const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(m.month);
                    if (monthIdx >= 0) {
                        const d = new Date(Date.UTC(m.year, monthIdx, e.date));
                        holidays.add(formatDateKey(d));
                    }
                }
            });
        });
    }

    // Templates
    const allTemplates = await prisma.lectureTemplate.findMany({
        where: {
            branchId: user.branchId,
            divisionId: user.divisionId,
            semester: user.semester,
            isActive: true
        }
    });

    // Electives
    const electiveSubjects = await prisma.elective.findMany({
        where: { branchId: user.branchId, semester: user.semester }
    });
    const allElectiveNames = new Set<string>();
    electiveSubjects.forEach(e => {
        if (e.firstElectiveName) allElectiveNames.add(e.firstElectiveName);
        if (e.secondElectiveName) allElectiveNames.add(e.secondElectiveName);
    });

    // Valid Templates
    const validTemplates = allTemplates.filter(tmpl => {
        if (tmpl.batch && !tmpl.batch.endsWith(user.subDivisionId)) return false;
        if (allElectiveNames.has(tmpl.subject)) {
            return tmpl.subject === user.electiveChoice1 || tmpl.subject === user.electiveChoice2;
        }
        return true;
    });

    const counts: Record<string, { total: number, title: string, type: LectureType }> = {};

    let currentDate = new Date(startDate);
    // Loop
    while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const weekday = jsDayToDbDay(currentDate.getUTCDay());

        if (!holidays.has(dateKey)) {
            const dailyTemplates = validTemplates.filter(t => t.weekday === weekday);
            for (const tmpl of dailyTemplates) {
                const key = `${tmpl.subject}-${tmpl.lectureType}`;
                if (!counts[key]) {
                    counts[key] = {
                        total: 0,
                        title: tmpl.subject,
                        type: tmpl.lectureType
                    };
                }
                counts[key].total++;
            }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return counts;
}

export async function getProjectedSchedule(userId: string, startDate: Date, endDate: Date) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const formatDateKey = (d: Date) => d.toISOString().split('T')[0];

    // Holidays
    const calendar = await prisma.academicCalendar.findFirst({ where: { year: "2025 - 2026" } });
    const holidays = new Set<string>();
    if (calendar && calendar.data) {
        const data = calendar.data as any;
        data.academicCalendar.months.forEach((m: any) => {
            m.events.forEach((e: any) => {
                if (e.type === "Holiday" || e.day === "Sunday") {
                    const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(m.month);
                    if (monthIdx >= 0) {
                        const d = new Date(Date.UTC(m.year, monthIdx, e.date));
                        holidays.add(formatDateKey(d));
                    }
                }
            });
        });
    }

    // Templates
    const allTemplates = await prisma.lectureTemplate.findMany({
        where: {
            branchId: user.branchId,
            divisionId: user.divisionId,
            semester: user.semester,
            isActive: true
        }
    });

    // Electives
    const electiveSubjects = await prisma.elective.findMany({
        where: { branchId: user.branchId, semester: user.semester }
    });
    const allElectiveNames = new Set<string>();
    electiveSubjects.forEach(e => {
        if (e.firstElectiveName) allElectiveNames.add(e.firstElectiveName);
        if (e.secondElectiveName) allElectiveNames.add(e.secondElectiveName);
    });

    // Valid Templates
    const validTemplates = allTemplates.filter(tmpl => {
        if (tmpl.batch && !tmpl.batch.endsWith(user.subDivisionId)) return false;
        if (allElectiveNames.has(tmpl.subject)) {
            return tmpl.subject === user.electiveChoice1 || tmpl.subject === user.electiveChoice2;
        }
        return true;
    });

    const schedule: { date: string, type: string, subject: string, startTime: string }[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const weekday = jsDayToDbDay(currentDate.getUTCDay());

        if (!holidays.has(dateKey)) {
            const dailyTemplates = validTemplates.filter(t => t.weekday === weekday);
            // Sort by time
            dailyTemplates.sort((a, b) => a.startTime.localeCompare(b.startTime));

            for (const tmpl of dailyTemplates) {
                schedule.push({
                    date: dateKey,
                    type: tmpl.lectureType,
                    subject: tmpl.subject,
                    startTime: tmpl.startTime
                });
            }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return schedule;
}
