import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await postexApi.getOperationalCities();
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to fetch cities' }, { status: 400 });
    }

    return NextResponse.json({ success: true, cities: res.cities });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching operational cities' }, { status: 500 });
  }
}
