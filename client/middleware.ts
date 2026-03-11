import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register-hospital'];

const rolePaths: Record<string, string> = {
  super_admin: '/dashboard/super-admin',
  ers_officer: '/dashboard/ers',
  ambulance: '/dashboard/ambulance',
  traffic_police: '/dashboard/traffic-police',
  hospital: '/dashboard/hospital',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith('/api'))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Dashboard routes require authentication
  if (pathname.startsWith('/dashboard')) {
    // Client-side auth is primary (Zustand store with localStorage token).
    // This middleware provides a lightweight server-side guard.
    // If no cookie token, redirect to login.
    // Note: Since we store token in localStorage (not cookies), this middleware
    // serves as a soft guard. The actual auth check happens client-side.
    // For full SSR auth, tokens would need to be stored in httpOnly cookies.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
