import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';

export const runtime = 'nodejs';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds, expectedAction } = body as {
      orderIds: string[];
      expectedAction?: 'CONFIRMATION' | 'TRACKING' | 'DELIVERED';
    };

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'No orders selected for WhatsApp action.' }, { status: 400 });
    }

    // Limit maximum batch size per request to 50 for rate limit safety
    const cleanOrderIds = orderIds.slice(0, 50);

    const cookieStore = await cookies();
    const adminId = cookieStore.get('wearomnia_admin_session')?.value;
    let adminName = 'Admin Communications';
    if (adminId) {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { name: true, email: true },
      });
      if (admin) adminName = admin.name || admin.email;
    }

    const results: Array<{
      orderId: string;
      orderNumber: string;
      success: boolean;
      action?: string;
      messageId?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < cleanOrderIds.length; i++) {
      const id = cleanOrderIds[i];

      // Delay between sends to respect Meta/WhatsApp rate limits (250ms)
      if (i > 0) {
        await delay(250);
      }

      // Fetch fresh order record from DB
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          shipments: { orderBy: { createdAt: 'desc' } },
          items: true,
        },
      });

      if (!order) {
        results.push({
          orderId: id,
          orderNumber: 'UNKNOWN',
          success: false,
          error: 'Order record not found in database.',
        });
        failCount++;
        continue;
      }

      const activeTracking =
        order.trackingNumber ||
        order.shipments?.find((s) => s.status !== 'CANCELLED' && Boolean(s.trackingNumber))?.trackingNumber;

      const isDelivered =
        order.status === 'DELIVERED' ||
        order.shipments?.some((s) => s.status === 'DELIVERED');

      // ─────────────────────────────────────────────────────────────────────────────
      // Server-Side State Machine for Next Valid Lifecycle Action
      // ─────────────────────────────────────────────────────────────────────────────
      let nextAction: 'CONFIRMATION' | 'TRACKING' | 'DELIVERED' | null = null;

      if (order.status === 'CONFIRMED' && !order.confirmationWhatsAppSentAt) {
        nextAction = 'CONFIRMATION';
      } else if (
        (order.status === 'CONFIRMED' || order.status === 'PACKING' || order.status === 'DISPATCHED') &&
        Boolean(activeTracking) &&
        !order.trackingWhatsAppSentAt
      ) {
        nextAction = 'TRACKING';
      } else if (isDelivered && !order.deliveredWhatsAppSentAt) {
        nextAction = 'DELIVERED';
      }

      if (!nextAction) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: 'No pending lifecycle WhatsApp action for current order state.',
        });
        failCount++;
        continue;
      }

      // Guard against sending mismatched action if expectedAction was specified
      if (expectedAction && expectedAction !== nextAction) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: `Order requires ${nextAction} action, not ${expectedAction}.`,
        });
        failCount++;
        continue;
      }

      try {
        const now = new Date();
        let sendResult: any = null;

        if (nextAction === 'CONFIRMATION') {
          sendResult = await NotificationService.sendConfirmationSuccess(order);
          if (sendResult?.success) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                confirmationWhatsAppSentAt: now,
                confirmationWhatsAppMessageId: sendResult.messageId || 'sent',
                timeline: {
                  create: {
                    status: order.status,
                    note: `Order Confirmation WhatsApp sent to ${order.customerPhone} by ${adminName}.`,
                    updatedBy: adminName,
                  },
                },
              },
            });

            await recordAuditLog(
              'WHATSAPP_CONFIRMATION_SENT',
              'Order',
              order.id,
              `Confirmation WhatsApp message sent for order ${order.orderNumber} to ${order.customerPhone}`
            );
          }
        } else if (nextAction === 'TRACKING') {
          sendResult = await NotificationService.sendStatusUpdate(
            {
              ...order,
              trackingNumber: activeTracking,
              courier: order.courier || 'PostEx',
            },
            'DISPATCHED'
          );

          if (sendResult?.success) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                trackingWhatsAppSentAt: now,
                trackingWhatsAppMessageId: sendResult.messageId || 'sent',
                timeline: {
                  create: {
                    status: order.status,
                    note: `PostEx Tracking WhatsApp (# ${activeTracking}) sent to ${order.customerPhone} by ${adminName}.`,
                    updatedBy: adminName,
                  },
                },
              },
            });

            await recordAuditLog(
              'WHATSAPP_TRACKING_SENT',
              'Order',
              order.id,
              `Tracking WhatsApp message sent for order ${order.orderNumber} (# ${activeTracking})`
            );
          }
        } else if (nextAction === 'DELIVERED') {
          sendResult = await NotificationService.sendStatusUpdate(order, 'DELIVERED');

          if (sendResult?.success) {
            // Also trigger review request with real product link
            const firstItem = order.items?.[0];
            const product = firstItem?.productId
              ? await prisma.product.findUnique({ where: { id: firstItem.productId } })
              : null;
            const reviewLink = product?.slug
              ? `https://www.wearomnia.com/product/${product.slug}#reviews`
              : 'https://www.wearomnia.com/shop';

            try {
              await NotificationService.sendReviewRequest(order, reviewLink);
            } catch (revErr) {
              console.warn('[Review Request Notification Warning]', revErr);
            }

            await prisma.order.update({
              where: { id: order.id },
              data: {
                deliveredWhatsAppSentAt: now,
                deliveredWhatsAppMessageId: sendResult.messageId || 'sent',
                deliveredAt: order.deliveredAt || now,
                timeline: {
                  create: {
                    status: 'DELIVERED',
                    note: `Delivery confirmation and review request WhatsApp sent to ${order.customerPhone} by ${adminName}.`,
                    updatedBy: adminName,
                  },
                },
              },
            });

            await recordAuditLog(
              'WHATSAPP_DELIVERED_SENT',
              'Order',
              order.id,
              `Delivery confirmation WhatsApp message sent for order ${order.orderNumber}`
            );
          }
        }

        if (sendResult?.success) {
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            success: true,
            action: nextAction,
            messageId: sendResult.messageId,
          });
          successCount++;
        } else {
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            success: false,
            action: nextAction,
            error: sendResult?.error || 'Failed to dispatch WhatsApp message via gateway.',
          });
          failCount++;
        }
      } catch (err: any) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          action: nextAction,
          error: err?.message || 'Unexpected error processing WhatsApp send.',
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: failCount === 0,
      total: cleanOrderIds.length,
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error('Error in send-lifecycle-whatsapp:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error processing WhatsApp lifecycle requests' },
      { status: 500 }
    );
  }
}
