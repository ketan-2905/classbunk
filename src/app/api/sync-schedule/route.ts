import { NextResponse } from "next/server";
import { syncUserSchedule } from "@/lib/schedule-generator";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        await syncUserSchedule(userId);

        return NextResponse.json({ success: true, message: "Schedule synced" });
    } catch (error: any) {
        console.error("Sync error:", error);
        if (error.message === "User not found" || error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWT_EXPIRED') {
            const cookieStore = await cookies();
            cookieStore.delete("session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
