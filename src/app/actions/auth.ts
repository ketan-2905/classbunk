'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me');

export async function registerUser(formData: any) {
    try {
        const {
            name,
            email,
            password,
            branchId,
            divisionId,
            semester,
            sapId,
            rollNo,
            subDivisionId
        } = formData;

        // 1. Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { sapId },
                    { rollNo }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) return { success: false, error: "Email already registered" };
            if (existingUser.sapId === sapId) return { success: false, error: "SAP ID already registered" };
            if (existingUser.rollNo === rollNo) return { success: false, error: "Roll Number already registered" };
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create User
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
                subDivisionId, // Storing "1", "2", etc.
            }
        });

        // 4. Create Session (Cookie)
        // For simplicity, we'll just set a cookie here via a helper or just return success
        // Ideally, we'd log them in automatically. Let's do that.

        // Create JWT
        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d') // 7 days
            .sign(JWT_SECRET);

        (await cookies()).set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return { success: true };

    } catch (error) {
        console.error("Registration Error:", error);
        return { success: false, error: "Registration failed. Please try again." };
    }
}

export async function loginUser(formData: any) {
    try {
        const { identifier, password } = formData; // identifier can be email or sapId

        // 1. Find User
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { sapId: identifier }
                ]
            }
        });

        if (!user) {
            return { success: false, error: "Invalid credentials" };
        }

        // 2. Verify Password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { success: false, error: "Invalid credentials" };
        }

        // 3. Create Session
        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        (await cookies()).set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return { success: true };

    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, error: "Login failed. Please try again." };
    }
}

export async function logoutUser() {
    (await cookies()).delete('session');
    redirect('/login');
}
