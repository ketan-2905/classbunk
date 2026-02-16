import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 1. Get all Elective Names
        const electiveSubjects = await prisma.elective.findMany({
            where: { branchId: user.branchId, semester: user.semester }
        });
        const allElectiveNames = new Set<string>();
        electiveSubjects.forEach(e => {
            if (e.firstElectiveName) allElectiveNames.add(e.firstElectiveName);
            if (e.secondElectiveName) allElectiveNames.add(e.secondElectiveName);
        });

        // 2. Identify Invalid Templates (Duplicates)
        const allTemplates = await prisma.lectureTemplate.findMany({
            where: {
                branchId: user.branchId,
                semester: user.semester,
                isActive: true
            }
        });

        const invalidTemplateIds: string[] = [];

        // Filter only chosen electives
        const chosenTemplates = allTemplates.filter(t =>
            allElectiveNames.has(t.subject) &&
            (t.subject === user.electiveChoice1 || t.subject === user.electiveChoice2)
        );

        // Group by Subject + Type
        const grouped = new Map<string, typeof allTemplates>();
        for (const t of chosenTemplates) {
            const key = `${t.subject}-${t.lectureType}`;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(t);
        }

        const debugLog: string[] = [];

        for (const [key, group] of grouped.entries()) {
            // Logic:
            // Check for EXACT match with user batch
            const matches = group.filter(t => !t.batch || t.batch.endsWith(user.subDivisionId));

            if (matches.length > 0) {
                // We have exact matches. Identify the NON-matches to delete.
                // Any template in this group that is NOT in `matches` is invalid.
                const matchIds = new Set(matches.map(m => m.id));
                const nonMatches = group.filter(t => !matchIds.has(t.id));

                if (nonMatches.length > 0) {
                    nonMatches.forEach(t => invalidTemplateIds.push(t.id));
                    debugLog.push(`Found Duplicates for ${key}: Keeping ${matches.map(m => m.batch).join(', ')}. Removing ${nonMatches.map(m => m.batch).join(', ')}.`);
                }
            } else {
                // No exact match. Keep all (Fallback logic).
                debugLog.push(`No exact match for ${key}. Keeping all (Fallback).`);
            }
        }

        if (invalidTemplateIds.length === 0) {
            return NextResponse.json({ success: true, message: "No duplicates found to clean." });
        }

        // 3. Delete Records
        // Delete Attendance first (FK constraint)
        const attendanceDelete = await prisma.attendance.deleteMany({
            where: {
                lectureInstance: {
                    lectureTemplateId: { in: invalidTemplateIds }
                }
            }
        });

        // Delete Lecture Instances
        const instanceDelete = await prisma.lectureInstance.deleteMany({
            where: {
                lectureTemplateId: { in: invalidTemplateIds }
            }
        });

        return NextResponse.json({
            success: true,
            deletedAttendance: attendanceDelete.count,
            deletedInstances: instanceDelete.count,
            cleanedTemplates: invalidTemplateIds,
            log: debugLog
        });

    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
