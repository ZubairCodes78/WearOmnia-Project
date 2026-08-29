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
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }

    const res = await postexApi.getShipperAdvice(trackingNumber);
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to get shipper advice from PostEx' }, { status: 400 });
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
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { trackingNumber, advice, shipperAdvice, comments, remarks, newAddress, newPhone, newCodAmount } = body;

    const targetAdvice = shipperAdvice || advice;
    if (!trackingNumber || !targetAdvice) {
      return NextResponse.json({ error: 'Tracking number and shipperAdvice (1 = Return Requested, 2 = Retry Attempt) are required' }, { status: 400 });
    }

    const res = await postexApi.saveShipperAdvice({
      trackingNumber,
      shipperAdvice: targetAdvice === 1 || targetAdvice === '1' ? 1 : 2,
      remarks: remarks || comments,
      newAddress,
      newPhone,
      newCodAmount,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to save shipper advice on PostEx' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error saving shipper advice' }, { status: 500 });
  }
}
