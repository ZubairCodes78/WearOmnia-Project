import { NextResponse } from 'next/server';
import { getPublicSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch site settings' }, { status: 500 });
  }
}