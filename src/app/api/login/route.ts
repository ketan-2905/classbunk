import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function POST(request: Request) {
    try {
        const { identifier, password } = await request.json();

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { sapId: identifier }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
        }

        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        // Optional: Set cookie here too if called directly
        const cookieStore = await cookies();
        cookieStore.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        return NextResponse.json({ success: true, token });
    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
    }
}