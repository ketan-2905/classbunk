import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback_secret_key_change_me');

// Define paths that do not require authentication
const PUBLIC_PATHS = ['/', '/auth/login', '/auth/signup'];

// Define paths that explicitly require guest access (redirect to dashboard if logged in)
const AUTH_PATHS = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Get the session cookie
    const token = request.cookies.get('session')?.value;

    // 2. Verify Session
    let isValidSession = false;
    if (token) {
        try {
            await jwtVerify(token, JWT_SECRET);
            isValidSession = true;
        } catch (error) {
            // Token invalid or expired
            isValidSession = false;
        }
    }

    // 3. Logic handling

    // Case A: User is logged in and tries to access guest-only pages (Login/Signup) -> Redirect to Dashboard
    if (isValidSession && AUTH_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Case B: User is NOT logged in and tries to access protected pages -> Redirect to Login
    // Protected pages are basically anything NOT in PUBLIC_PATHS.
    // We can also allow static files / _next / favicon to pass through by default matchers.
    const isPublicPath = PUBLIC_PATHS.some(path =>
        path === '/' ? pathname === path : pathname.startsWith(path)
    );

    if (!isValidSession && !isPublicPath) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (isValidSession && pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Config to limit middleware execution scope
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes, though some might need protection, handled usually inside or we can protect them here)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets (if any)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
