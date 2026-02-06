'use server';

import apiClient from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function getDashboardData(clientDateStr?: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        // Note: Axios call is server-to-server.
        // We need to pass the Cookie header so the API route can verify the user.
        const res = await apiClient.get('/dashboard', {
            params: { date: clientDateStr },
            headers: {
                Cookie: `session=${token}`
            }
        });
        return res.data;
    } catch (error: any) {
        console.error("Action getDashboardData Error:", error?.response?.data || error.message);
        // Map API error to Action return format
        return { success: false, error: "Failed to fetch data" };
    }
}

export async function toggleAttendance(attendanceId: string, status: boolean) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        const res = await apiClient.post('/attendance/toggle',
            { attendanceId, status },
            {
                headers: { Cookie: `session=${token}` }
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("Action toggleAttendance Error:", error?.response?.data || error.message);
        return { success: false };
    }
}
