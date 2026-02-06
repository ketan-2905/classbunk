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

        // Verify token to ensure user is logged in
        await jwtVerify(token, JWT_SECRET);

        const { attendanceId, status } = await request.json();

        if (!attendanceId) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

        await prisma.attendance.update({
            where: { id: attendanceId },
            data: { attended: status }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Toggle API Error:", error);
        return NextResponse.json({ success: false, error: "Prohibited" }, { status: 500 });
    }
}
