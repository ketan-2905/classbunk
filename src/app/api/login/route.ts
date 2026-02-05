import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        }
    })

    if (!user) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const session = await prisma.session.create({
        data: {
            sessionToken,
            expiresAt,
            userId: user.id
        }
    })

    const cookieStore = await cookies()

    cookieStore.set({
        name: "session",
        value: sessionToken,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt
    })

    return NextResponse.json({ message: "Login successful", session: session }, { status: 200 })
}