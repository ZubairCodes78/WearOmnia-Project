import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notifications/notification-service';
import { WhatsAppProvider } from '@/lib/notifications/whatsapp-provider';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';
import { normalizePhone } from '@/lib/phone';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const provider = new WhatsAppProvider();

/**
 * STEP 3: META WHATSAPP WEBHOOK VERIFICATION (GET)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const settings = await NotificationService.getSettings();

  if (mode === 'subscribe' && token === settings.whatsapp_verify_token) {
    // console.log('[WhatsApp Webhook Verified Successfully]');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden: Invalid verification token' }, { status: 403 });
}

/**
 * STEP 3, 4, 5, 6: META WHATSAPP INCOMING WEBHOOK HANDLER (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);
    const bodyText = bodyBuffer.toString('utf-8');
    const body = JSON.parse(bodyText || '{}');

    const settings = await NotificationService.getSettings();

    // Verify Signature in Production mode if app secret is provided
    if (settings.whatsapp_mode === 'PRODUCTION' && settings.whatsapp_app_secret) {
      const signature = req.headers.get('x-hub-signature-256');
      const isValid = provider.validateWebhookSignature(bodyBuffer, signature, settings.whatsapp_app_secret);
      if (!isValid) {
        console.error('[WhatsApp Webhook Security Warning] Invalid HMAC signature!');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Extract Message Object from Meta Payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // Check status updates (DELIVERED, READ)
    const statusUpdate = value?.statuses?.[0];
    if (statusUpdate) {
      const messageId = statusUpdate.id;
      const newStatus = statusUpdate.status?.toUpperCase(); // DELIVERED, READ, FAILED

      if (messageId && newStatus) {
        await prisma.notificationLog.updateMany({
          where: { whatsappMessageId: messageId },
          data: { status: newStatus, updatedAt: new Date() },
        });
      }
      return NextResponse.json({ status: 'STATUS_LOGGED' });
    }

    if (!message) {
      return NextResponse.json({ status: 'NO_MESSAGE_EVENT' });
    }

    const senderPhone = message.from; // e.g. "923001234567"
    let buttonPayload = '';

    if (message.type === 'interactive' && message.interactive?.button_reply) {
      buttonPayload = message.interactive.button_reply.id; // e.g. "confirm_order_<orderId>"
    } else if (message.type === 'text') {
      buttonPayload = message.text?.body || '';
    }

    // Process Simulated or Real Confirmation Payload
    let targetOrderId = '';
    if (buttonPayload.startsWith('confirm_order_')) {
      targetOrderId = buttonPayload.replace('confirm_order_', '');
    }

    if (!targetOrderId) {
      // console.log(`[WhatsApp Webhook] Unrecognized button or text payload: ${buttonPayload}`);
      return NextResponse.json({ status: 'IGNORED_PAYLOAD' });
    }

    // STEP 2 & 3: Find Target Order in DB
    const order = await prisma.order.findUnique({
      where: { id: targetOrderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`[WhatsApp Webhook] Order not found for ID: ${targetOrderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // SECURITY CHECK 1: Prevent duplicate confirmations / replay attacks
    if (order.status !== 'PENDING') {
      // console.log(`[WhatsApp Security] Order #${order.orderNumber} is already in status '${order.status}'. Ignoring replay request.`);
      return NextResponse.json({
        status: 'IGNORED_REPLAY',
        message: `Order #${order.orderNumber} is already ${order.status}`,
      });
    }

    // SECURITY CHECK 2: Validate Customer Phone Number match
    const normSender = normalizePhone(senderPhone);
    const normOrderPhone = normalizePhone(order.customerWhatsapp || order.customerPhone);

    if (normSender !== normOrderPhone && settings.whatsapp_mode === 'PRODUCTION') {
      console.warn(`[WhatsApp Security Mismatch] Sender phone (${normSender}) does not match Order Phone (${normOrderPhone}).`);
      await prisma.auditLog.create({
        data: {
          action: 'WHATSAPP_SECURITY_ALERT',
          entity: 'Order',
          entityId: order.id,
          details: `Rejected confirmation attempt: sender ${normSender} mismatch with order phone ${normOrderPhone}`,
        },
      });
      return NextResponse.json({ error: 'Phone number mismatch' }, { status: 403 });
    }

    // STEP 3: AUTOMATICALLY UPDATE DATABASE STATUS (PENDING -> CONFIRMED)
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        updatedAt: new Date(),
      },
    });

    // Append Order Timeline Entry
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        previousStatus: 'PENDING',
        note: `Order automatically CONFIRMED by customer via WhatsApp interactive button click.`,
        updatedBy: 'WhatsApp Webhook Automation',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'WHATSAPP_AUTO_CONFIRM',
        entity: 'Order',
        entityId: order.id,
        details: `Customer ${order.customerName} confirmed Order #${order.orderNumber} via WhatsApp. Status updated to CONFIRMED.`,
      },
    });

    // STEP 5: Create Admin Notification
    const adminNotif = await prisma.adminNotification.create({
      data: {
        orderId: order.id,
        type: 'WHATSAPP_AUTO_CONFIRMED',
        title: `✅ Order #${order.orderNumber} Confirmed via WhatsApp`,
        message: `Customer ${order.customerName} (${order.customerPhone}) tapped 'Confirm Order' on WhatsApp. Status is now CONFIRMED.`,
      },
    });

    // STEP 6: Send Step 6 Confirmation Reply to Customer
    await NotificationService.sendConfirmationSuccess(updatedOrder);

    // STEP 5: Send Step 5 Alert to Admin
    await NotificationService.sendAdminAlert(
      updatedOrder,
      `Customer ${updatedOrder.customerName} auto-confirmed Order #${updatedOrder.orderNumber} via WhatsApp button click!`
    );

    // STEP 4: REAL-TIME BROADCAST TO ADMIN DASHBOARD (SSE + Event Emitter)
    broadcastAdminEvent({
      type: 'ORDER_AUTO_CONFIRMED',
      order: updatedOrder,
      notification: adminNotif,
      sound: settings.whatsapp_sound_enabled,
      timestamp: new Date().toISOString(),
    });

    // console.log(`[WhatsApp Automation Success] Order #${order.orderNumber} confirmed automatically via WhatsApp!`);

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      status: 'CONFIRMED',
    });
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
