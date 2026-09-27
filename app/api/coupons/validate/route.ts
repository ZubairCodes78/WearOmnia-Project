import { NextResponse } from 'next/server';
import { validateCouponServer } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { code, subtotal, isPreOrder } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const result = await validateCouponServer({
      code,
      subtotal: Number(subtotal) || 0,
      isPreOrder: Boolean(isPreOrder),
      now: new Date(),
    });

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      code: result.code,
      discountType: result.discountType,
      discountValue: result.discountValue,
      calculatedDiscount: result.calculatedDiscount,
      isPreOrderOnly: result.isPreOrderOnly,
      autoApply: result.autoApply,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

