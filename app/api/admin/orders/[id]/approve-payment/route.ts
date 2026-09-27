import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.isPreOrder) {
      return NextResponse.json({ error: 'This order is not a pre-order' }, { status: 400 });
    }

    // Idempotency: If already approved, return success immediately
    if (order.preOrderPaymentStatus === 'PAYMENT_APPROVED') {
      return NextResponse.json({
        success: true,
        message: 'Payment was already verified and approved.',
        order,
      });
    }

    // Get Admin Name / ID from cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('wearomnia_admin_session')?.value;
    let adminName = 'Admin Finance Team';
    if (adminId) {
      const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { name: true, email: true } });
      if (admin) adminName = admin.name || admin.email;
    }

    // Check screenshot exists
    if (!order.preOrderPaymentScreenshotUrl) {
      return NextResponse.json(
        { error: 'Cannot approve payment: No payment proof screenshot exists for this order.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const advanceAmount = order.preOrderAdvanceAmount || 0;
    const advanceAmountFormatted = Number(advanceAmount).toLocaleString();

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        preOrderPaymentStatus: 'PAYMENT_APPROVED',
        amountPaid: advanceAmount,
        preOrderRemainingAmount: Math.max(0, order.totalAmount - advanceAmount),
        preOrderPaymentVerifiedAt: now,
        preOrderPaymentVerifiedBy: adminName,
        confirmedAt: now,
        confirmedBy: adminName,
        status: 'CONFIRMED',
        timeline: {
          create: {
            status: 'CONFIRMED',
            note: `Advance payment verified and approved by ${adminName}. Pre-order confirmed (Rs. ${advanceAmountFormatted} advance received).`,
            updatedBy: adminName,
          },
        },
      },
    });

    // Record audit log
    await recordAuditLog(
      'PRE_ORDER_PAYMENT_APPROVED',
      'Order',
      order.id,
      `Pre-Order ${order.orderNumber} advance payment approved by ${adminName} (${adminId || 'session'}). Amount paid: Rs. ${advanceAmountFormatted}`
    );

    // Send WhatsApp notification to customer
    try {
      await NotificationService.sendPreOrderApproved(updatedOrder);
    } catch (e) {
      console.error('[WhatsApp Pre-order Approval Notification Error]', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Advance payment successfully approved. Order is now CONFIRMED.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error approving pre-order payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to approve pre-order payment' },
      { status: 500 }
    );
  }
}
