import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';
import { validatePhone, normalizePhone } from '@/lib/phone';
import { BulkRecipientResult, BulkWhatsAppResponse } from '@/lib/notifications/types';

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
    const { orderIds, expectedAction, forceResend } = body as {
      orderIds: string[];
      expectedAction?: 'CONFIRMATION' | 'TRACKING' | 'DELIVERED' | 'AUTO';
      forceResend?: boolean;
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

    const results: BulkRecipientResult[] = [];
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < cleanOrderIds.length; i++) {
      const id = cleanOrderIds[i];

      // Delay between sends to respect Meta/WhatsApp rate limits (250ms)
      if (i > 0) {
        await delay(250);
      }

      // Fetch fresh order record from DB with items and shipments
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
          customerName: 'Unknown',
          customerPhone: 'N/A',
          status: 'FAILED',
          action: expectedAction || 'UNKNOWN',
          error: 'Order record not found in database.',
        });
        failCount++;
        continue;
      }

      const rawPhone = order.customerWhatsapp || order.customerPhone || '';
      const normalized = normalizePhone(rawPhone);

      // Phase 3: Phone Number Validation before sending
      if (!normalized || !validatePhone(normalized)) {
        const errorReason = `Invalid Pakistani phone number: "${rawPhone}". Expected 03XXXXXXXXX (11 digits) or 923XXXXXXXXX (12 digits).`;
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: rawPhone,
          status: 'SKIPPED',
          action: expectedAction || 'VALIDATION',
          error: errorReason,
          skipped: true,
          skippedReason: errorReason,
        });
        skippedCount++;
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
      let targetAction: 'CONFIRMATION' | 'TRACKING' | 'DELIVERED' | null = null;

      if (expectedAction === 'CONFIRMATION') {
        if (order.confirmationWhatsAppSentAt && !forceResend) {
          const skipReason = `Order confirmation already sent on ${new Date(order.confirmationWhatsAppSentAt).toLocaleDateString('en-PK')}.`;
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SKIPPED',
            action: 'CONFIRMATION',
            error: skipReason,
            skipped: true,
            skippedReason: skipReason,
          });
          skippedCount++;
          continue;
        }
        targetAction = 'CONFIRMATION';
      } else if (expectedAction === 'TRACKING') {
        if (!activeTracking) {
          const skipReason = 'No active courier tracking number found for order. Parcel must be booked first.';
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SKIPPED',
            action: 'TRACKING',
            error: skipReason,
            skipped: true,
            skippedReason: skipReason,
          });
          skippedCount++;
          continue;
        }
        if (order.trackingWhatsAppSentAt && !forceResend) {
          const skipReason = `Tracking WhatsApp already sent on ${new Date(order.trackingWhatsAppSentAt).toLocaleDateString('en-PK')}.`;
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SKIPPED',
            action: 'TRACKING',
            error: skipReason,
            skipped: true,
            skippedReason: skipReason,
          });
          skippedCount++;
          continue;
        }
        targetAction = 'TRACKING';
      } else if (expectedAction === 'DELIVERED') {
        if (!isDelivered) {
          const skipReason = 'Order is not in DELIVERED state. Cannot send delivery notification.';
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SKIPPED',
            action: 'DELIVERED',
            error: skipReason,
            skipped: true,
            skippedReason: skipReason,
          });
          skippedCount++;
          continue;
        }
        if (order.deliveredWhatsAppSentAt && !forceResend) {
          const skipReason = `Delivered WhatsApp already sent on ${new Date(order.deliveredWhatsAppSentAt).toLocaleDateString('en-PK')}.`;
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SKIPPED',
            action: 'DELIVERED',
            error: skipReason,
            skipped: true,
            skippedReason: skipReason,
          });
          skippedCount++;
          continue;
        }
        targetAction = 'DELIVERED';
      } else {
        // Smart Auto-Lifecycle Resolution:
        // 1. If confirmation not sent -> Send Confirmation
        // 2. Else if tracking present and tracking not sent -> Send Tracking
        // 3. Else if delivered and delivery not sent -> Send Delivery
        // 4. Else -> Skip as all complete
        if (!order.confirmationWhatsAppSentAt) {
          targetAction = 'CONFIRMATION';
        } else if (Boolean(activeTracking) && !order.trackingWhatsAppSentAt) {
          targetAction = 'TRACKING';
        } else if (isDelivered && !order.deliveredWhatsAppSentAt) {
          targetAction = 'DELIVERED';
        } else {
          const skipReason = 'All WhatsApp lifecycle notifications already completed for this order.';
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SKIPPED',
            action: 'AUTO',
            error: skipReason,
            skipped: true,
            skippedReason: skipReason,
          });
          skippedCount++;
          continue;
        }
      }

      try {
        const now = new Date();
        let sendResult: any = null;

        if (targetAction === 'CONFIRMATION') {
          sendResult = await NotificationService.sendOrderConfirmation(order);
          if (sendResult?.success) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                confirmationWhatsAppSentAt: now,
                confirmationWhatsAppMessageId: sendResult.messageId || 'sent',
                timeline: {
                  create: {
                    status: order.status,
                    note: `Official Order Confirmation WhatsApp sent to ${rawPhone} by ${adminName}.`,
                    updatedBy: adminName,
                  },
                },
              },
            });

            await recordAuditLog(
              'WHATSAPP_CONFIRMATION_SENT',
              'Order',
              order.id,
              `Confirmation WhatsApp message sent for order ${order.orderNumber} to ${rawPhone}`
            );
          }
        } else if (targetAction === 'TRACKING') {
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
                    note: `PostEx Tracking WhatsApp (# ${activeTracking}) sent to ${rawPhone} by ${adminName}.`,
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
        } else if (targetAction === 'DELIVERED') {
          sendResult = await NotificationService.sendStatusUpdate(order, 'DELIVERED');

          if (sendResult?.success) {
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
                    note: `Delivery confirmation and review request WhatsApp sent to ${rawPhone} by ${adminName}.`,
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
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'SENT',
            action: targetAction,
            messageId: sendResult.messageId,
          });
          successCount++;
        } else {
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: rawPhone,
            status: 'FAILED',
            action: targetAction,
            error: sendResult?.error || 'Failed to dispatch WhatsApp message via Meta Cloud API.',
            isTransient: sendResult?.isTransient,
          });
          failCount++;
        }
      } catch (err: any) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: rawPhone,
          status: 'FAILED',
          action: targetAction || 'UNKNOWN',
          error: err?.message || 'Unexpected error processing WhatsApp send.',
          isTransient: true,
        });
        failCount++;
      }
    }

    const responsePayload: BulkWhatsAppResponse = {
      success: failCount === 0,
      total: cleanOrderIds.length,
      sent: successCount,
      failed: failCount,
      skipped: skippedCount,
      results,
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Error in send-lifecycle-whatsapp:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error processing WhatsApp lifecycle requests' },
      { status: 500 }
    );
  }
}
