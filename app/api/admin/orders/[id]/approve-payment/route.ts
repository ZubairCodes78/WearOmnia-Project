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

    if (!order.isPreOrder && order.paymentMethod !== 'FULL_ADVANCE' && order.status !== 'PAYMENT_REVIEW_PENDING') {
      return NextResponse.json({ error: 'This order does not require payment review' }, { status: 400 });
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
    const isRegularFullAdvance = !order.isPreOrder && (order.paymentMethod === 'FULL_ADVANCE' || order.preOrderAdvancePercent === 100);
    const approvedAmount = isRegularFullAdvance ? order.totalAmount : (order.preOrderAdvanceAmount || 0);
    const approvedAmountFormatted = Number(approvedAmount).toLocaleString();
    const remainingAmount = Math.max(0, order.totalAmount - approvedAmount);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        preOrderPaymentStatus: 'PAYMENT_APPROVED',
        amountPaid: approvedAmount,
        preOrderRemainingAmount: remainingAmount,
        preOrderPaymentVerifiedAt: now,
        preOrderPaymentVerifiedBy: adminName,
        confirmedAt: now,
        confirmedBy: adminName,
        status: 'CONFIRMED',
        timeline: {
          create: {
            status: 'CONFIRMED',
            note: isRegularFullAdvance
              ? `100% Full advance payment verified and approved by ${adminName}. Order confirmed (Rs. ${approvedAmountFormatted} received in full).`
              : `Advance payment verified and approved by ${adminName}. Pre-order confirmed (Rs. ${approvedAmountFormatted} advance received).`,
            updatedBy: adminName,
          },
        },
      },
    });

    // Record audit log
    await recordAuditLog(
      isRegularFullAdvance ? 'ORDER_PAYMENT_APPROVED' : 'PRE_ORDER_PAYMENT_APPROVED',
      'Order',
      order.id,
      `${isRegularFullAdvance ? 'Regular Order' : 'Pre-Order'} ${order.orderNumber} payment approved by ${adminName} (${adminId || 'session'}). Amount paid: Rs. ${approvedAmountFormatted}`
    );

    // Send WhatsApp notification to customer
    try {
      if (isRegularFullAdvance) {
        await NotificationService.sendPaymentApproved(updatedOrder);
      } else {
        await NotificationService.sendPreOrderApproved(updatedOrder);
      }
    } catch (e) {
      console.error('[WhatsApp Payment Approval Notification Error]', e);
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
