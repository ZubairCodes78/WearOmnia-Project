import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await postexApi.getMerchantAddresses();
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to fetch merchant addresses' }, { status: 400 });
    }

    return NextResponse.json({ success: true, addresses: res.addresses });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching merchant addresses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const res = await postexApi.createMerchantAddress(body);

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to create pickup address' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.data, message: res.message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error creating merchant address' }, { status: 500 });
  }
}
