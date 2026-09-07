import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const IS_COMING_SOON = process.env.COMING_SOON === 'true';

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
    return NextResponse.next();
  }

  // ── Pre-Launch Mode: Restrict public visitors to Coming Soon page ─────────────
  if (IS_COMING_SOON) {
    const isPublicStorefrontRoute =
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/images') &&
      !pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/i) &&
      pathname !== '/' &&
      pathname !== '/robots.txt' &&
      pathname !== '/sitemap.xml';

    if (isPublicStorefrontRoute) {
      const homeUrl = new URL('/', req.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};