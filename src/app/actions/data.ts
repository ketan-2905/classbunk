'use server';

import prisma from '@/lib/prisma';

export async function getBranches() {
    console.log("Fetching branches...");
    try {
        const branches = await prisma.branch.findMany({
            select: { id: true, name: true }
        });
        console.log("Branches fetched:", branches);
        return { success: true, data: branches };
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        return { success: false, data: [] };
    }
}


export async function getDivisions(branchId: string) {
    try {
        const divisions = await prisma.division.findMany({
            where: { branchId },
            select: { id: true, name: true }
        });
        return { success: true, data: divisions };
    } catch (error) {
        console.error("Failed to fetch divisions:", error);
        return { success: false, data: [] };
    }
}
