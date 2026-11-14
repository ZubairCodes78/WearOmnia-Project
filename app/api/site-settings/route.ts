import { NextResponse } from 'next/server';
import { getPublicSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json(
      { settings },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch site settings' }, { status: 500 });
  }
}