import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        if (!dateStr) return NextResponse.json({ error: "Date required" }, { status: 400 });

        const [y, m, d] = dateStr.split('-').map(Number);

        // Find Weekday
        const targetDate = new Date(Date.UTC(y, m - 1, d));
        let weekday = targetDate.getUTCDay();
        if (weekday === 0) weekday = 7; // Sunday=7

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { branch: true, division: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get All Templates for that weekday
        const templates = await prisma.lectureTemplate.findMany({
            where: {
                branchId: user.branchId,
                semester: user.semester,
                isActive: true,
                weekday: weekday
            }
        });

        // Current Scheduled (User's Schedule)
        // We fetch instances to see what is already there?
        // Let frontend handle mapping. We just return ALL available options.

        return NextResponse.json({
            success: true,
            templates: templates.map(t => ({
                id: t.id,
                subject: t.subject,
                type: t.lectureType,
                startTime: t.startTime,
                endTime: t.endTime,
                faculty: t.faculty,
                room: t.room,
                batch: t.batch,
                isMyBatch: !t.batch || t.batch.endsWith(user.subDivisionId)
            }))
        });

    } catch (error) {
        console.error("Available Lectures API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
