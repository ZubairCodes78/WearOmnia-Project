import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';
import { normalizePhone } from '@/lib/phone';
import { paymentProofExists } from '@/lib/storage';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone, screenshotKey, paymentMethodId } = body;

    if (!orderNumber || !phone || !screenshotKey) {
      return NextResponse.json(
        { error: 'Order Number, Phone number, and Screenshot are required' },
        { status: 400 }
      );
    }

    const proofExists = await paymentProofExists(screenshotKey);
    if (!proofExists) {
      return NextResponse.json(
        { error: 'Uploaded screenshot not found. Please upload again.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify phone belongs to this order
    const orderPhone = normalizePhone(order.customerPhone);
    const orderWhatsapp = order.customerWhatsapp ? normalizePhone(order.customerWhatsapp) : null;
    if (orderPhone !== normalizedPhone && orderWhatsapp !== normalizedPhone) {
      return NextResponse.json(
        { error: 'The phone number provided does not match the order record.' },
        { status: 403 }
      );
    }

    if (!order.isPreOrder) {
      return NextResponse.json({ error: 'This order is not a pre-order' }, { status: 400 });
    }

    if (order.preOrderPaymentStatus === 'PAYMENT_APPROVED') {
      return NextResponse.json(
        { error: 'Payment for this order has already been verified and approved.' },
        { status: 400 }
      );
    }

    let methodName = order.preOrderPaymentMethodName;
    if (paymentMethodId) {
      const method = await prisma.preOrderPaymentMethod.findUnique({
        where: { id: paymentMethodId },
      });
      if (method) methodName = method.displayName;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        preOrderPaymentScreenshotUrl: screenshotKey,
        preOrderPaymentStatus: 'PAYMENT_REVIEW_PENDING',
        preOrderPaymentRejectionReason: null,
        preOrderPaymentMethodName: methodName,
        timeline: {
          create: {
            status: order.status,
            note: `Customer re-uploaded advance payment proof screenshot (${methodName || 'Bank Transfer'}). Sent back to finance review queue.`,
            updatedBy: 'Customer (Re-upload)',
          },
        },
      },
    });

    // Notify Admin Console
    const adminNotif = await prisma.adminNotification.create({
      data: {
        orderId: order.id,
        type: 'PREORDER_PAYMENT_PENDING',
        title: `🔄 Payment Proof Resubmitted: ${order.orderNumber}`,
        message: `Customer ${order.customerName} resubmitted payment proof for Pre-Order ${order.orderNumber}.`,
      },
    }).catch(() => null);

    broadcastAdminEvent({
      type: 'PAYMENT_PROOF_RESUBMITTED',
      order: updatedOrder,
      notification: adminNotif,
      sound: true,
      timestamp: new Date().toISOString(),
    });

    await recordAuditLog(
      'PRE_ORDER_SCREENSHOT_REPLACED',
      'Order',
      order.id,
      `Customer resubmitted payment proof screenshot for Pre-Order ${order.orderNumber}`
    );

    return NextResponse.json({
      success: true,
      message: 'Payment proof resubmitted successfully. Our team will verify it shortly.',
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error('Error resubmitting pre-order screenshot:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to resubmit payment proof' },
      { status: 500 }
    );
  }
}
