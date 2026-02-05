import prisma from "../src/lib/prisma.js";
import fs from "fs";
import path from "path";

const academicCalendar25_26Data = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "data/academicCalendar/academicCalendar25-26.json"),
        "utf-8"
    )
);

const csedstimetableData = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "data/timetables/csedstimetable.json"),
        "utf-8"
    )
);

async function main() {
    /* ===============================
       ACADEMIC CALENDAR
    =============================== */
    await prisma.academicCalendar.upsert({
        where: { year: "2025-2026" },
        update: {},
        create: {
            year: "2025-2026",
            data: academicCalendar25_26Data
        },
    });

    /* ===============================
       BRANCHES CONFIG
    =============================== */
    const branches = [
        { name: "Electronics & Telecommunication Engineering", seats: 180 },
        { name: "Information Technology", seats: 180 },
        { name: "Computer Engineering", seats: 180 },
        { name: "Mechanical Engineering", seats: 180 },
        { name: "Computer Science and Engineering (Data Science)", seats: 180 },
        { name: "Artificial Intelligence and Machine Learning", seats: 120 },
        { name: "Artificial Intelligence (AI) and Data Science", seats: 60 },
        {
            name:
                "Computer Science and Engineering (IOT and Cyber Security with Block Chain Technology)",
            seats: 60,
        },
    ];

    for (const branch of branches) {

        const createdBranch = await prisma.branch.create({
            data: {
                name: branch.name,
                capacity: branch.seats,
            },
        });

        /* ===============================
           TIMETABLE (ONLY FOR CSE DS)
        =============================== */
        if (branch.name === "Computer Science and Engineering (Data Science)") {

            for (let i = 1; i <= 3; i++) {
                await prisma.division.create({
                    data: {
                        name: `D${i}`,
                        branchId: createdBranch.id,
                    },
                });

            }

            // Fetch newly created divisions
            const divisions = await prisma.division.findMany({
                where: { branchId: createdBranch.id }
            });

            // Create Timetable Record (Keep this for reference/JSON storage)
            // We attach it to the first division (D1) or handled generally
            const d1Division = divisions.find(d => d.name === "D1");

            if (d1Division) {
                await prisma.timetable.create({
                    data: {
                        branchId: createdBranch.id,
                        semester: 6,
                        effectiveFrom: new Date("2026-01-27"),
                        data: csedstimetableData as any,
                    },
                });

                // PARSE AND SEED LECTURE TEMPLATES
                console.log("Seeding Lecture Templates for D1...");
                const dayMap: Record<string, number> = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7 };
                const timeSlots = csedstimetableData.timeSlotDefinitions as Record<string, { start: string, end: string }>;
                const schedule = csedstimetableData.weeklySchedule as Record<string, any[] | { note: string }>;

                for (const [dayName, daySchedule] of Object.entries(schedule)) {
                    if (!Array.isArray(daySchedule)) continue; // Skip objects like Saturday note

                    const weekday = dayMap[dayName];

                    for (const period of daySchedule) {
                        if (period.type === "BREAK") continue;

                        const timeSlot = timeSlots[period.periodId.toString()];
                        if (!timeSlot) continue;

                        if (period.sessions) {
                            for (const session of period.sessions) {
                                // Handle Batch Logic
                                let batch = session.batch;
                                if (batch === "D1+D2" || !batch) batch = null; // Whole Class

                                await prisma.lectureTemplate.create({
                                    data: {
                                        branchId: createdBranch.id,
                                        divisionId: d1Division.id,
                                        semester: 6,
                                        subject: session.subject,
                                        lectureType: session.type === "PR" ? "PR" : "TH",
                                        batch: batch,
                                        faculty: session.faculty,
                                        room: session.room,
                                        weekday: weekday,
                                        startTime: timeSlot.start,
                                        endTime: timeSlot.end,
                                        isActive: true
                                    }
                                });
                            }
                        }
                    }
                }
            }



        }
    }
}



main()
    .then(() => {
        console.log("✅ Database seeded successfully");
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


