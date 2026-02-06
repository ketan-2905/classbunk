import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');
        const semester = searchParams.get('semester');

        if (!branchId || !semester) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const electives = await prisma.elective.findMany({
            where: {
                branchId: branchId,
                semester: parseInt(semester)
            },
            select: {
                firstElectiveName: true,
                secondElectiveName: true
            }
        });

        // Extract unique options for each slot
        const slot1Options = Array.from(new Set(electives.map(e => e.firstElectiveName).filter(Boolean)));
        const slot2Options = Array.from(new Set(electives.map(e => e.secondElectiveName).filter(Boolean)));

        return NextResponse.json({
            success: true,
            data: {
                slot1: slot1Options,
                slot2: slot2Options
            }
        });

    } catch (error) {
        console.error("Electives API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch electives" }, { status: 500 });
    }
}
