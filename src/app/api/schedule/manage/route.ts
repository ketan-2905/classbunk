import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        const body = await request.json();
        const { action, lectureTemplateId, date, lectureInstanceId, attended } = body;

        // Validation
        if (!action || !date) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const targetDate = new Date(date);

        if (action === 'add') {
            // User wants to ADD an EXTRA lecture (e.g. from another batch)
            if (!lectureTemplateId) {
                return NextResponse.json({ success: false, error: "Template ID required for 'add'" }, { status: 400 });
            }

            // 1. Find or Create Instance
            let instance = await prisma.lectureInstance.findFirst({
                where: {
                    lectureTemplateId: lectureTemplateId,
                    date: targetDate
                }
            });

            if (!instance) {
                instance = await prisma.lectureInstance.create({
                    data: {
                        lectureTemplateId: lectureTemplateId,
                        date: targetDate,
                        status: "EXTRA" // Mark as Extra? Or Scheduled? If it's extra for THIS user but normal for others...
                        // If we create it, it implies it wasn't scheduled globally?
                        // Or maybe it was scheduled but syncing didn't pick it up for this user.
                        // Let's use SCHEDULED.
                    }
                });
            }

            // 2. Create/Update Attendance
            await prisma.attendance.upsert({
                where: {
                    userId_lectureInstanceId: {
                        userId: userId,
                        lectureInstanceId: instance.id
                    }
                },
                update: {
                    attended: true,
                    isIgnored: false,
                    isExtra: true
                },
                create: {
                    userId: userId,
                    lectureInstanceId: instance.id,
                    attended: true,
                    isIgnored: false,
                    isExtra: true
                }
            });

            return NextResponse.json({ success: true, message: "Lecture added successfully" });

        } else if (action === 'remove') {
            // User wants to REMOVE a scheduled lecture (Mark as Ignored)
            // We need instance ID or template+date
            let instanceId = lectureInstanceId;

            if (!instanceId && lectureTemplateId) {
                // Find instance
                const instance = await prisma.lectureInstance.findFirst({
                    where: { lectureTemplateId: lectureTemplateId, date: targetDate }
                });
                if (instance) instanceId = instance.id;
            }

            if (!instanceId) {
                // Nothing to remove?
                // If instance doesn't exist, we can't ignore it (it's not even scheduled).
                return NextResponse.json({ success: false, error: "Lecture instance not found." }, { status: 404 });
            }

            // Update Attendance
            await prisma.attendance.upsert({
                where: {
                    userId_lectureInstanceId: {
                        userId: userId,
                        lectureInstanceId: instanceId
                    }
                },
                update: {
                    isIgnored: true,
                    isExtra: false // Can't be extra if ignored? Or maybe ignored extra. 
                },
                create: {
                    userId: userId,
                    lectureInstanceId: instanceId,
                    attended: false, // Default to absent if ignoring
                    isIgnored: true,
                    isExtra: false
                }
            });

            return NextResponse.json({ success: true, message: "Lecture removed successfully" });

        } else if (action === 'toggle-attendance') {
            // Just toggle attended status for an existing instance
            // Reusing logic from existing toggle endpoint but simplified here for consistency?
            // Or rely on existing endpoint.
            // Let's assume frontend calls standard toggle.
            return NextResponse.json({ success: false, error: "Use standard toggle endpoint" }, { status: 400 });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Schedule Manage Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
