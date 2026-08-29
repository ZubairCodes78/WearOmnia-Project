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
    const mode = searchParams.get('mode') || 'all';

    if (mode === 'unbooked') {
      const res = await postexApi.getUnbookedOrders();
      if (!res.success) {
        return NextResponse.json({ error: res.message || 'Failed to fetch unbooked orders from PostEx' }, { status: 400 });
      }
      return NextResponse.json({ success: true, orders: res.orders, total: res.orders.length });
    }

    const res = await postexApi.getAllOrders({
      orderStatusID: searchParams.get('orderStatusID') || searchParams.get('status') || 0,
      fromDate: searchParams.get('fromDate') || searchParams.get('startDate') || undefined,
      toDate: searchParams.get('toDate') || searchParams.get('endDate') || undefined,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to fetch orders from PostEx' }, { status: 400 });
    }

    return NextResponse.json({ success: true, orders: res.orders, total: res.orders.length, message: res.message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching PostEx orders' }, { status: 500 });
  }
}
