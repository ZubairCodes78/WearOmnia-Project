import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { normalizePhone } from '@/lib/phone';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, trackingNumber: explicitTracking } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const trackingNumber =
      explicitTracking ||
      order.trackingNumber ||
      order.shipments?.find((s) => s.status !== 'FAILED' && s.status !== 'CANCELLED' && Boolean(s.trackingNumber))
        ?.trackingNumber;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'No active PostEx tracking number found for this order. Please dispatch the order to PostEx first.' },
        { status: 400 }
      );
    }

    if (!order.customerPhone) {
      return NextResponse.json(
        { error: 'Customer phone number is missing from the order record.' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(order.customerPhone);
    const trackingUrl = `https://postex.pk/tracking?trackingNumber=${encodeURIComponent(trackingNumber)}`;

    const messageText = `Hello ${order.customerName || 'Valued Customer'},\n\nYour WearOMNIA order #${order.orderNumber} has been dispatched via PostEx.\n\nTracking Number: ${trackingNumber}\n\nYou can track your shipment using the PostEx tracking service:\n${trackingUrl}\n\nThank you for shopping with WearOMNIA.`;

    const encodedMsg = encodeURIComponent(messageText);
    const whatsappWebUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    // Try sending automated notification via NotificationService
    let deliveryResult = { success: true, method: 'DIRECT_WHATSAPP_LINK' };
    try {
      const dispatchResult = await NotificationService.sendStatusUpdate(
        {
          ...order,
          trackingNumber,
          courier: 'PostEx',
        },
        'DISPATCHED'
      );
      if (dispatchResult && dispatchResult.success) {
        deliveryResult = { success: true, method: 'AUTOMATED_WHATSAPP_API' };
      }
    } catch (e) {
      console.warn('[NotifyTracking] Automated gateway fallback to direct link:', e);
    }

    // Record in OrderTimeline and NotificationLog
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `Customer tracking notification dispatched to ${order.customerPhone} (PostEx Tracking: ${trackingNumber})`,
        updatedBy: 'Admin PostEx Control Tower',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'SEND_TRACKING_NOTIFICATION',
        entity: 'Order',
        entityId: order.id,
        details: `Dispatched PostEx tracking # ${trackingNumber} notification to ${order.customerPhone}`,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      trackingNumber,
      customerPhone: order.customerPhone,
      message: messageText,
      whatsappUrl: whatsappWebUrl,
      deliveryMethod: deliveryResult.method,
    });
  } catch (error: any) {
    console.error('[NotifyTracking Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch tracking notification.' },
      { status: 500 }
    );
  }
}
