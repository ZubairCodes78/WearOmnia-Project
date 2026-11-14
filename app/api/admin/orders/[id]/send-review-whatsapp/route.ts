import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications/notification-service';
import { buildReviewRequestWhatsAppMessage } from '@/lib/notifications/whatsapp-provider';
import { validatePhone, normalizePhone } from '@/lib/phone';
import { getOrCreateOrderReviewToken } from '@/lib/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve review invitation preview, tokenized URL, and dispatch history
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        customerWhatsapp: true,
        status: true,
        reviewToken: true,
        reviewTokenExpiresAt: true,
        reviewWhatsAppSentAt: true,
        reviewWhatsAppMessageId: true,
        deliveredAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        {
          error: `Review requests can only be sent for DELIVERED orders. Current status: ${order.status}`,
          eligible: false,
        },
        { status: 400 }
      );
    }

    const rawPhone = order.customerWhatsapp || order.customerPhone || '';
    const normalized = normalizePhone(rawPhone);

    const { token, reviewUrl } = await getOrCreateOrderReviewToken(order.id);
    const previewMessage = buildReviewRequestWhatsAppMessage(order.customerName, order.orderNumber, reviewUrl);
    const directWhatsAppUrl = normalized
      ? `https://wa.me/${normalized}?text=${encodeURIComponent(previewMessage)}`
      : null;

    return NextResponse.json({
      eligible: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: rawPhone,
      normalizedPhone: normalized,
      isPhoneValid: Boolean(normalized && validatePhone(normalized)),
      status: order.status,
      reviewToken: token,
      reviewUrl,
      reviewWhatsAppSentAt: order.reviewWhatsAppSentAt,
      reviewWhatsAppMessageId: order.reviewWhatsAppMessageId,
      previewMessage,
      directWhatsAppUrl,
    });
  } catch (error: any) {
    console.error('Error fetching review WhatsApp preview:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST: Manually dispatch post-delivery review invitation WhatsApp message
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: `Review requests can only be sent for DELIVERED orders. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    const rawPhone = order.customerWhatsapp || order.customerPhone || '';
    const normalized = normalizePhone(rawPhone);

    if (!normalized || !validatePhone(normalized)) {
      return NextResponse.json(
        {
          error: `Invalid Pakistani phone number: "${rawPhone}". Expected 03XXXXXXXXX (11 digits) or 923XXXXXXXXX (12 digits).`,
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const adminId = cookieStore.get('wearomnia_admin_session')?.value;
    let adminName = 'Admin Operations';
    if (adminId) {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { name: true, email: true },
      });
      if (admin) adminName = admin.name || admin.email;
    }

    // Generate or retrieve the cryptographic token
    const { token, reviewUrl } = await getOrCreateOrderReviewToken(order.id);

    // Send through existing WhatsApp integration
    const sendResult = (await NotificationService.sendReviewRequest(order, reviewUrl)) as {
      success: boolean;
      messageId?: string;
      simulated?: boolean;
      error?: string;
    } | undefined;

    const previewMessage = buildReviewRequestWhatsAppMessage(order.customerName, order.orderNumber, reviewUrl);
    const directWhatsAppUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(previewMessage)}`;

    if (!sendResult || !sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult?.error || 'Failed to dispatch WhatsApp review request via Meta Cloud API.',
          directWhatsAppUrl,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Persist dispatch status, timestamp, timeline note, and audit log
    await prisma.order.update({
      where: { id: order.id },
      data: {
        reviewWhatsAppSentAt: now,
        reviewWhatsAppMessageId: sendResult.messageId || 'sent',
        timeline: {
          create: {
            status: 'DELIVERED',
            note: `Official Review Request WhatsApp sent to ${rawPhone} by ${adminName}.${sendResult.simulated ? ' (Simulated Mode)' : ''}`,
            updatedBy: adminName,
          },
        },
      },
    });

    await recordAuditLog(
      'MANUAL_WHATSAPP_REVIEW_REQUEST_SENT',
      'Order',
      order.id,
      `Manual review request WhatsApp sent for order ${order.orderNumber} to ${rawPhone} by ${adminName}. Message ID: ${sendResult.messageId || 'simulated'}`
    );

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      sentAt: now.toISOString(),
      reviewUrl,
      simulated: sendResult.simulated,
      directWhatsAppUrl,
    });
  } catch (error: any) {
    console.error('Error dispatching review WhatsApp message:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
