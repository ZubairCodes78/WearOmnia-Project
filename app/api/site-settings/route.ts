import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch site settings' }, { status: 500 });
  }
}