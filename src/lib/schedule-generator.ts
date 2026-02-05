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

    // Valid Templates for User (Batch Check)
    const validTemplates = allTemplates.filter(tmpl => {
        if (!tmpl.batch) return true; // Common
        return tmpl.batch.endsWith(user.subDivisionId); // "D11" matches "1"
    });

    console.log(`SYNC DEBUG: User ${user.subDivisionId}. Found ${allTemplates.length} total tmpl, ${validTemplates.length} matches.`);

    // Generate Expected Instances
    const instancesToCreate: { lectureTemplateId: string; date: Date; status: LectureStatus }[] = [];

    // Iterate Dates
    const currentDate = new Date(semStartDate);
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
