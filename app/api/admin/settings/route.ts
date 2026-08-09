import { NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/settings';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await updateSiteSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update site settings' }, { status: 500 });
  }
}
