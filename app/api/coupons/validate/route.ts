import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 404 });
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of Rs. ${coupon.minOrderAmount.toLocaleString()} required for this coupon` },
        { status: 400 }
      );
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      calculatedDiscount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    calculatedDiscount = Math.min(calculatedDiscount, subtotal);

    return NextResponse.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
