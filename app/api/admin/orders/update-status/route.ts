import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications/notification-service';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';
import { recordAuditLog } from '@/lib/audit';
import { isValidTransition, STATUS_NOTIFICATION_MESSAGES, OrderStatus } from '@/lib/order-status';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status, trackingNumber, courier, internalAdminNote } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const previousOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, timeline: { orderBy: { createdAt: 'desc' } } },
    });

    if (!previousOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate status transition if changing status
    if (status && status !== previousOrder.status) {
      if (!isValidTransition(previousOrder.status, status)) {
        return NextResponse.json({
          error: `Invalid status transition from ${previousOrder.status} to ${status}`,
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (status && status !== previousOrder.status) {
      updateData.status = status;
    }
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    if (courier !== undefined) {
      updateData.courier = courier;
    }
    if (internalAdminNote !== undefined) {
      updateData.internalAdminNote = internalAdminNote;
    }

    // Create timeline entry for status changes
    if (status && status !== previousOrder.status) {
      updateData.timeline = {
        create: {
          status,
          previousStatus: previousOrder.status,
          note: `Status updated to ${status} via Admin Dashboard${trackingNumber ? ` | Tracking: ${trackingNumber}` : ''}${courier ? ` | Courier: ${courier}` : ''}`,
          updatedBy: 'Admin',
        },
      };
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, timeline: { orderBy: { createdAt: 'desc' } } },
    });

    // Audit log for every change
    const changeDetails = [];
    if (status && status !== previousOrder.status) {
      changeDetails.push(`Status: ${previousOrder.status} → ${status}`);
    }
    if (trackingNumber && trackingNumber !== previousOrder.trackingNumber) {
      changeDetails.push(`Tracking: ${trackingNumber}`);
    }
    if (courier && courier !== previousOrder.courier) {
      changeDetails.push(`Courier: ${courier}`);
    }

    if (changeDetails.length > 0) {
      await recordAuditLog(
        'ORDER_STATUS_UPDATED',
        'Order',
        orderId,
        `Order #${previousOrder.orderNumber}: ${changeDetails.join(', ')}`
      );
    }

    // Trigger WhatsApp notification if status changed
    if (status && status !== previousOrder.status) {
      try {
        // Store notification event (dev mode - no real send)
        const notificationMessage = STATUS_NOTIFICATION_MESSAGES[status as OrderStatus]?.(
          previousOrder.orderNumber,
          courier || previousOrder.courier || undefined,
          trackingNumber || previousOrder.trackingNumber || undefined
        );

        if (notificationMessage) {
          await NotificationService.logNotification({
            orderId: updated.id,
            recipientPhone: updated.customerWhatsapp || updated.customerPhone,
            messageType: `STATUS_UPDATE_${status}`,
            provider: 'WHATSAPP',
            payload: { message: notificationMessage, status },
            status: 'QUEUED', // Dev mode - queued but not sent
          });
        }

        await NotificationService.sendStatusUpdate(updated, status);
      } catch (e) {
        console.error('[WhatsApp Status Notification Catch]', e);
      }

      // Broadcast real-time SSE event to all connected admin consoles
      broadcastAdminEvent({
        type: 'STATUS_CHANGED',
        order: updated,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
