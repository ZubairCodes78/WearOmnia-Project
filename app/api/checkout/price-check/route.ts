import { NextResponse } from 'next/server';
import { calculateServerCartQuote } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const couponCode = body.couponCode || null;
    const isPreOrderOrder = Boolean(body.isPreOrder);
    const city = body.city || undefined;
    const paymentMethod = body.paymentMethod || undefined;

    const quote = await calculateServerCartQuote({
      items,
      couponCode,
      isPreOrderOrder,
      city,
      paymentMethod,
      now: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        quote,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Checkout price-check error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to compute checkout quote' },
      { status: 500 }
    );
  }
}

