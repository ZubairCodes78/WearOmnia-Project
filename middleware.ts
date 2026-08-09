import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow access to admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all admin routes
  if (pathname.startsWith('/admin')) {
    const adminSession = req.cookies.get('wearomnia_admin_session');
    
    if (!adminSession) {
      // Redirect to login if no session
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};