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
    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'A rejection reason is required so the customer can be notified.' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.isPreOrder && order.paymentMethod !== 'FULL_ADVANCE' && order.status !== 'PAYMENT_REVIEW_PENDING') {
      return NextResponse.json({ error: 'This order does not have payment review enabled' }, { status: 400 });
    }

    // Get Admin Name / ID from cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('wearomnia_admin_session')?.value;
    let adminName = 'Admin Finance Team';
    if (adminId) {
      const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { name: true, email: true } });
      if (admin) adminName = admin.name || admin.email;
    }

    const now = new Date();
    const rejectionReason = reason.trim();
    const isRegularFullAdvance = !order.isPreOrder && (order.paymentMethod === 'FULL_ADVANCE' || order.preOrderAdvancePercent === 100);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        preOrderPaymentStatus: 'PAYMENT_REJECTED',
        preOrderPaymentRejectionReason: rejectionReason,
        preOrderPaymentRejectedAt: now,
        preOrderPaymentRejectedBy: adminName,
        timeline: {
          create: {
            status: order.status,
            note: `Payment proof rejected by ${adminName}. Reason: ${rejectionReason}`,
            updatedBy: adminName,
          },
        },
      },
    });

    // Record audit log
    await recordAuditLog(
      isRegularFullAdvance ? 'ORDER_PAYMENT_REJECTED' : 'PRE_ORDER_PAYMENT_REJECTED',
      'Order',
      order.id,
      `${isRegularFullAdvance ? 'Regular Order' : 'Pre-Order'} ${order.orderNumber} payment rejected by ${adminName} (${adminId || 'session'}). Reason: ${rejectionReason}`
    );

    // Send WhatsApp notification to customer
    try {
      if (isRegularFullAdvance) {
        await NotificationService.sendPaymentRejected(updatedOrder, rejectionReason);
      } else {
        await NotificationService.sendPreOrderRejected(updatedOrder, rejectionReason);
      }
    } catch (e) {
      console.error('[WhatsApp Payment Rejection Notification Error]', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment proof rejected and customer has been notified.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error rejecting pre-order payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reject pre-order payment' },
      { status: 500 }
    );
  }
}
