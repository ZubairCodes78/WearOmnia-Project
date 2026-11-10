import { NextResponse } from 'next/server';
import { validateCouponServer } from '@/lib/coupons';
import { calculateServerCartQuote } from '@/lib/campaigns';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { code, subtotal, isPreOrder, items, city, paymentMethod } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    // When cart items are provided, validate strictly through the unified campaign + coupon engine
    if (Array.isArray(items) && items.length > 0) {
      const quote = await calculateServerCartQuote({
        items,
        couponCode: code,
        isPreOrderOrder: Boolean(isPreOrder),
        city,
        paymentMethod,
        now: new Date(),
      });

      if (!quote.couponValid || !quote.couponCode) {
        return NextResponse.json(
          {
            error: quote.couponError || 'Coupon cannot be applied to this bag.',
            stackingResolution: quote.stackingResolution,
            stackingMessage: quote.stackingMessage,
          },
          { status: 400 }
        );
      }

      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: quote.couponCode },
      });

      return NextResponse.json({
        code: quote.couponCode,
        discountType: dbCoupon?.discountType || 'FIXED',
        discountValue: dbCoupon?.discountValue ?? quote.couponDiscountAmount,
        minOrderAmount: dbCoupon?.minOrderAmount ?? 0,
        maxDiscountAmount: dbCoupon?.maxDiscountAmount ?? null,
        calculatedDiscount: quote.couponDiscountAmount,
        isPreOrderOnly: Boolean(dbCoupon?.isPreOrderOnly),
        autoApply: Boolean(dbCoupon?.autoApply),
        stackingResolution: quote.stackingResolution,
        stackingMessage: quote.stackingMessage,
        quote,
      });
    }

    // Legacy / subtotal-only callers
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
