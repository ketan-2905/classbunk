import { cookies } from "next/headers"
import prisma from "./prisma"

export async function getSessionUser() {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
        return null
    }

    const session = await prisma.session.findUnique({
        where: {
            sessionToken: sessionToken,

        },
        include: { user: true }
    })



    if (!session) {
        return null
    }
    if (session.expiresAt < new Date()) return null

    return session.user
}