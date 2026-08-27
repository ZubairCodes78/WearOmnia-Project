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
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }

    const res = await postexApi.getShipperAdvice(trackingNumber);
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to get shipper advice' }, { status: 400 });
    }

    return NextResponse.json({ success: true, advice: res.advice });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error fetching shipper advice' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { trackingNumber, advice, comments, newAddress, newPhone, newCodAmount } = body;

    if (!trackingNumber || !advice) {
      return NextResponse.json({ error: 'Tracking number and advice are required' }, { status: 400 });
    }

    const res = await postexApi.saveShipperAdvice({
      trackingNumber,
      advice,
      comments,
      newAddress,
      newPhone,
      newCodAmount,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to save shipper advice' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error saving shipper advice' }, { status: 500 });
  }
}
