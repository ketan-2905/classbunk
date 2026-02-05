
import 'dotenv/config';
import { syncUserSchedule } from '../lib/schedule-generator';
import prisma from '../lib/prisma';

async function main() {
    const userId = '357235cc-899a-4e92-bd47-4575ceadc8a0';
    console.log("Debugging Sync for User:", userId);

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.error("User not found in DB");
            return;
        }
        console.log("User Snapshot:", {
            id: user.id,
            branchId: user.branchId,
            divisionId: user.divisionId,
            semester: user.semester,
            subDivisionId: user.subDivisionId
        });

        const result = await syncUserSchedule(userId);
        console.log("Sync Result:", result);

    } catch (e) {
        console.error("Sync Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
