import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit } = await req.json();

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Code and Discount Value are required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Coupon creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}
