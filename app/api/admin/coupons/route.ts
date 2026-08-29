import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, isActive } = await req.json();

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Coupon code and discount value are required.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists.` }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await recordAuditLog(
      'COUPON_CREATED',
      'Coupon',
      coupon.id,
      `Created coupon ${coupon.code} (${coupon.discountType}: ${coupon.discountValue})`
    );

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Coupon creation error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create coupon' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (code) updateData.code = code.trim().toUpperCase();
    if (discountType) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount || '0');
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog(
      'COUPON_UPDATED',
      'Coupon',
      coupon.id,
      `Updated coupon ${coupon.code}. Active: ${coupon.isActive}`
    );

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Coupon update error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let id: string | null = null;
    try {
      const body = await req.json();
      id = body.id;
    } catch {
      const { searchParams } = new URL(req.url);
      id = searchParams.get('id');
    }

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id } });

    await recordAuditLog(
      'COUPON_DELETED',
      'Coupon',
      id,
      `Deleted coupon ${coupon.code} (Used: ${coupon.usedCount} times)`
    );

    return NextResponse.json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Coupon delete error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
