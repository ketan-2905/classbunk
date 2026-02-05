import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

export async function POST(req: Request) {

    const { name, email, password, branchId, semester, division, sapId, rollNo, subDivisionId } = await req.json();

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email },
            { sapId },
            { rollNo }]
        }
    })

    if (existingUser) {
        if (existingUser.email === email) {
            return NextResponse.json({ message: "User already With email" }, { status: 400 })
        }
        if (existingUser.sapId === sapId) {
            return NextResponse.json({ message: "User already With sapId" }, { status: 400 })
        }
        if (existingUser.rollNo === rollNo) {
            return NextResponse.json({ message: "User already With rollNo" }, { status: 400 })
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    const newuser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            branchId,
            semester,
            divisionId: division,
            sapId,
            rollNo,
            subDivisionId
        }
    })

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const session = await prisma.session.create({
        data: {
            sessionToken,
            expiresAt,
            userId: newuser.id
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

    return NextResponse.json({ message: "User created successfully" }, { status: 201 })


}