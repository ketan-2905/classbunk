import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    const cookieStore = await cookies()

    if (cookieStore.get("session")) {
        await prisma.session.delete({
            where: {
                sessionToken: cookieStore.get("session")?.value
            }
        })
    }

    cookieStore.delete("session")
    return NextResponse.json({ message: "Logout successful" }, { status: 200 })
}