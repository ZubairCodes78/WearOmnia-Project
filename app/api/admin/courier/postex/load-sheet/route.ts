import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackingNumbers, orderRefNumbers } = await req.json();
    const list = trackingNumbers || orderRefNumbers || [];

    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json({ error: 'Please provide an array of tracking numbers or order reference numbers' }, { status: 400 });
    }

    const res = await postexApi.generateLoadSheet(list);
    if (!res.success) {
      return NextResponse.json({ error: res.message || 'Failed to generate load sheet' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      loadSheetId: res.loadSheetId,
      loadSheetUrl: res.loadSheetUrl,
      message: res.message,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error generating load sheet' }, { status: 500 });
  }
}
