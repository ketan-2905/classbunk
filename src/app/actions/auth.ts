'use server';

import apiClient from '@/lib/api-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function registerUser(formData: any) {
    try {
        const res = await apiClient.post('/signup', formData);

        if (res.data.success && res.data.token) {
            const cookieStore = await cookies();
            cookieStore.set('session', res.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            });
        }
        return res.data;
    } catch (error: any) {
        console.error("Register Action Error:", error?.response?.data || error.message);
        return { success: false, error: error?.response?.data?.error || "Registration failed" };
    }
}

export async function loginUser(formData: any) {
    try {
        const res = await apiClient.post('/login', formData);

        if (res.data.success && res.data.token) {
            const cookieStore = await cookies();
            cookieStore.set('session', res.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/'
            });
        }
        return res.data;
    } catch (error: any) {
        console.error("Login Action Error:", error?.response?.data || error.message);
        return { success: false, error: error?.response?.data?.error || "Login failed" };
    }
}

export async function logoutUser() {
    try {
        await apiClient.post('/logout');
        (await cookies()).delete('session');
    } catch (e) {
        console.error("Logout Action Error", e);
    }
    redirect('/auth/login');
}
