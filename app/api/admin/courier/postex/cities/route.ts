import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const operationalCityType = searchParams.get('operationalCityType') || undefined;

    const res = await postexApi.getOperationalCities({ operationalCityType });
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to fetch operational cities from PostEx' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      cities: res.cities,
      total: res.cities.length,
      message: res.message,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching operational cities' }, { status: 500 });
  }
}
