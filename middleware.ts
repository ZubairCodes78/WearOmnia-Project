import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCampaignPhase } from '@/lib/preorder';

function isComingSoonMode(): boolean {
  const envComingSoon =
    process.env.NEXT_PUBLIC_COMING_SOON === 'true' ||
    process.env.COMING_SOON === 'true';

  const phase = getCampaignPhase();
  return envComingSoon && phase === 'BEFORE_LAUNCH';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  // ── Google Search Console Verification Bypass (Strictly No Redirects) ─────
  if (pathname === '/google6aabd54b56273003.html') {
    return NextResponse.next();
  }

  // ── Canonical Domain Redirection (301 Permanent: apex -> www) ───────────────
  if (host === 'wearomnia.com') {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.host = 'www.wearomnia.com';
    canonicalUrl.protocol = 'https:';
    return NextResponse.redirect(canonicalUrl, { status: 301 });
  }

  // ── Permanently Retired Products (410 Gone for search engines to drop cleanly) ──
  if (pathname === '/product/the-sovereign-velvet-kaftan') {
    return new NextResponse(
      '<!DOCTYPE html><html><head><title>410 Gone | WearOMNIA</title><meta name="robots" content="noindex, nofollow"></head><body style="font-family:sans-serif;text-align:center;padding:50px;background:#FAF8F5;color:#103D42;"><h1>410 - Garment Retired</h1><p>This design has been permanently retired from our collection.</p><p><a href="/shop" style="color:#103D42;font-weight:bold;">Browse Current Outfits &rarr;</a></p></body></html>',
      {
        status: 410,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=604800, s-maxage=604800',
        },
      }
    );
  }

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
  if (isComingSoonMode()) {
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