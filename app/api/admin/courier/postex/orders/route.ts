import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'all';

    if (mode === 'unbooked') {
      const res = await postexApi.getUnbookedOrders();
      if (!res.success) {
        return NextResponse.json({ error: res.message || 'Failed to fetch unbooked orders' }, { status: 400 });
      }
      return NextResponse.json({ success: true, orders: res.orders });
    }

    const res = await postexApi.getAllOrders({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      orderStatus: searchParams.get('orderStatus') || undefined,
      cityName: searchParams.get('cityName') || undefined,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to fetch orders from PostEx' }, { status: 400 });
    }

    return NextResponse.json({ success: true, orders: res.orders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching PostEx orders' }, { status: 500 });
  }
}
