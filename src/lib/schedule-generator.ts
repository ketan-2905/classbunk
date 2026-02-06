import prisma from '@/lib/prisma';
import { LectureTemplate, LectureType, LectureStatus, Prisma } from '@/generated/prisma/client';

// Map Weekday Number (0=Sunday to 6=Saturday) to our DB Schema (1=Monday ... 7=Sunday)
function jsDayToDbDay(jsDay: number): number {
    if (jsDay === 0) return 7; // Sunday
    return jsDay; // Mon(1) to Sat(6) match
}

export async function syncUserSchedule(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) throw new Error("User not found");

    // Helper for YYYY-MM-DD
    const formatDateKey = (d: Date) => d.toISOString().split('T')[0];

    // Dates
    const semStartDate = new Date(Date.UTC(2026, 0, 27));
    const today = new Date();
    const loopLimit = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 2));

    // OPTIMIZATION: Incremental Sync
    const lastAttendance = await prisma.attendance.findFirst({
        where: { userId: user.id },
        include: { lectureInstance: true },
        orderBy: { lectureInstance: { date: 'desc' } }
    });

    let currentDate = new Date(semStartDate);

    if (lastAttendance) {
        const lastDate = new Date(lastAttendance.lectureInstance.date);
        const lastDateUtc = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()));

        if (lastDateUtc >= loopLimit) {
            return { success: true };
        }
        currentDate = lastDateUtc;
    }


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

    // Elective Analysis
    const electiveSubjects = await prisma.elective.findMany({
        where: { branchId: user.branchId, semester: user.semester }
    });
    const allElectiveNames = new Set<string>();
    electiveSubjects.forEach(e => {
        if (e.firstElectiveName) allElectiveNames.add(e.firstElectiveName);
        if (e.secondElectiveName) allElectiveNames.add(e.secondElectiveName);
    });

    console.log("SYNC DEBUG: Known Electives:", Array.from(allElectiveNames));
    console.log("SYNC DEBUG: User Choices:", user.electiveChoice1, user.electiveChoice2);

    // Valid Templates for User (Batch Check + Elective Check)
    const validTemplates = allTemplates.filter(tmpl => {
        // 1. Batch Check
        if (tmpl.batch && !tmpl.batch.endsWith(user.subDivisionId)) return false;

        // 2. Elective Check
        if (allElectiveNames.has(tmpl.subject)) {
            // It is an elective subject. User must have chosen it.
            const isUserChoice = tmpl.subject === user.electiveChoice1 || tmpl.subject === user.electiveChoice2;
            return isUserChoice;
        }

        return true; // Core subject
    });

    console.log(`SYNC DEBUG: User ${user.subDivisionId}. Found ${allTemplates.length} total tmpl, ${validTemplates.length} valid matches.`);


    // Generate Expected Instances
    const instancesToCreate: { lectureTemplateId: string; date: Date; status: LectureStatus }[] = [];

    // Iterate Dates

    let loops = 0;
    while (currentDate <= loopLimit && loops < 365) {
        loops++;
        const dateKey = formatDateKey(currentDate);
        const weekday = jsDayToDbDay(currentDate.getUTCDay());

        if (holidays.has(dateKey)) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            continue;
        }

        // Templates for this weekday
        const dailyTemplates = validTemplates.filter(t => t.weekday === weekday);

        for (const tmpl of dailyTemplates) {
            // Clone date
            const instanceDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
            instancesToCreate.push({
                lectureTemplateId: tmpl.id,
                date: instanceDate,
                status: "SCHEDULED"
            });
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    if (instancesToCreate.length === 0) return { success: true };

    console.log(`SYNC DEBUG: Bulk creating ${instancesToCreate.length} instances...`);

    // Bulk Create Instances
    await prisma.lectureInstance.createMany({
        data: instancesToCreate,
        skipDuplicates: true
    });

    // Fetch Created/Existing Instances IDs
    const templateIds = validTemplates.map(t => t.id);
    const createdInstances = await prisma.lectureInstance.findMany({
        where: {
            lectureTemplateId: { in: templateIds },
            date: { gte: semStartDate, lte: loopLimit }
        },
        select: { id: true }
    });

    console.log(`SYNC DEBUG: Found ${createdInstances.length} instances to mark attendance.`);

    // Bulk Create Attendance
    const attendanceData = createdInstances.map(inst => ({
        userId: user.id,
        lectureInstanceId: inst.id,
        attended: true
    }));

    if (attendanceData.length > 0) {
        await prisma.attendance.createMany({
            data: attendanceData,
            skipDuplicates: true
        });
    }

    return { success: true };
}
