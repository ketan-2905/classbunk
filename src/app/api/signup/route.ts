import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function POST(request: Request) {
    try {
        const formData = await request.json();
        const {
            name, email, password, branchId, divisionId, semester, sapId, rollNo, subDivisionId,
            electiveChoice1, electiveChoice2
        } = formData;

        // Check exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { sapId }, { rollNo }]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });
            if (existingUser.sapId === sapId) return NextResponse.json({ success: false, error: "SAP ID already registered" }, { status: 400 });
            if (existingUser.rollNo === rollNo) return NextResponse.json({ success: false, error: "Roll Number already registered" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                branchId,
                divisionId,
                semester: parseInt(semester),
                sapId,
                rollNo,
                subDivisionId,
                electiveChoice1,
                electiveChoice2
            }
        });

        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        const cookieStore = await cookies();
        cookieStore.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        return NextResponse.json({ success: true, token });

    } catch (error) {
        console.error("Signup API Error:", error);
        return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
    }
}