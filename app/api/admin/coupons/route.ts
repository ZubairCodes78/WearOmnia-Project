import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import {
  getCouponScheduleStatus,
  formatKarachiDateTime,
  calculateDurationDisplay,
} from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const enrichedCoupons = coupons.map((c) => {
      const schedule = getCouponScheduleStatus(c, now);
      return {
        ...c,
        scheduleStatus: schedule.status,
        statusLabel: schedule.label,
        durationDisplay: schedule.durationDisplay,
        formattedStartDate: schedule.startDateFormatted,
        formattedEndDate: schedule.endDateFormatted,
      };
    });

    return NextResponse.json({ success: true, coupons: enrichedCoupons });
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

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perCustomerLimit,
      startDate,
      expiryDate,
      timezone,
      isPreOrderOnly,
      applicableProducts,
      autoApply,
      isActive,
    } = await req.json();

    if (!code || discountValue === undefined || discountValue === null || discountValue === '') {
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
        perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit) : null,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        timezone: timezone || 'Asia/Karachi',
        isPreOrderOnly: Boolean(isPreOrderOnly),
        applicableProducts: applicableProducts || null,
        autoApply: Boolean(autoApply),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await recordAuditLog(
      'COUPON_CREATED',
      'Coupon',
      coupon.id,
      `Created coupon ${coupon.code} (${coupon.discountType}: ${coupon.discountValue}, Schedule: ${coupon.startDate ? formatKarachiDateTime(coupon.startDate) : 'None'} to ${coupon.expiryDate ? formatKarachiDateTime(coupon.expiryDate) : 'None'})`
    );

    const schedule = getCouponScheduleStatus(coupon);
    const enriched = {
      ...coupon,
      scheduleStatus: schedule.status,
      statusLabel: schedule.label,
      durationDisplay: schedule.durationDisplay,
      formattedStartDate: schedule.startDateFormatted,
      formattedEndDate: schedule.endDateFormatted,
    };

    return NextResponse.json({ success: true, coupon: enriched });
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
    const {
      id,
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perCustomerLimit,
      startDate,
      expiryDate,
      timezone,
      isPreOrderOnly,
      applicableProducts,
      autoApply,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (code) updateData.code = code.trim().toUpperCase();
    if (discountType) updateData.discountType = discountType;
    if (discountValue !== undefined && discountValue !== null && discountValue !== '') {
      updateData.discountValue = parseFloat(discountValue);
    }
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount || '0');
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (perCustomerLimit !== undefined) updateData.perCustomerLimit = perCustomerLimit ? parseInt(perCustomerLimit) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (timezone !== undefined) updateData.timezone = timezone || 'Asia/Karachi';
    if (isPreOrderOnly !== undefined) updateData.isPreOrderOnly = Boolean(isPreOrderOnly);
    if (applicableProducts !== undefined) updateData.applicableProducts = applicableProducts || null;
    if (autoApply !== undefined) updateData.autoApply = Boolean(autoApply);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog(
      'COUPON_UPDATED',
      'Coupon',
      coupon.id,
      `Updated coupon ${coupon.code}. Active: ${coupon.isActive}, Schedule: ${coupon.startDate ? formatKarachiDateTime(coupon.startDate) : 'None'} to ${coupon.expiryDate ? formatKarachiDateTime(coupon.expiryDate) : 'None'}`
    );

    const schedule = getCouponScheduleStatus(coupon);
    const enriched = {
      ...coupon,
      scheduleStatus: schedule.status,
      statusLabel: schedule.label,
      durationDisplay: schedule.durationDisplay,
      formattedStartDate: schedule.startDateFormatted,
      formattedEndDate: schedule.endDateFormatted,
    };

    return NextResponse.json({ success: true, coupon: enriched });
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
