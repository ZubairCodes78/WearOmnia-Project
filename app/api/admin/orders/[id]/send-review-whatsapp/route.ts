import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { buildReviewRequestWhatsAppMessage } from '@/lib/notifications/whatsapp-provider';
import { validatePhone, normalizePhone } from '@/lib/phone';
import { getOrCreateOrderReviewToken } from '@/lib/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve manual review invitation preview, tokenized URL, eligible products, and status
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
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        {
          error: `Review invitations can only be generated for DELIVERED orders. Current status: ${order.status}`,
          eligible: false,
        },
        { status: 400 }
      );
    }

    const rawPhone = order.customerWhatsapp || order.customerPhone || '';
    const normalized = normalizePhone(rawPhone);

    const { token, reviewUrl } = await getOrCreateOrderReviewToken(order.id);
    const defaultMessage = buildReviewRequestWhatsAppMessage(order.customerName, order.orderNumber, reviewUrl);
    const directWhatsAppUrl = normalized
      ? `https://wa.me/${normalized}?text=${encodeURIComponent(defaultMessage)}`
      : null;

    let reviewStatus: 'NOT_SENT' | 'COPIED' | 'MARKED_AS_SENT' = 'NOT_SENT';
    if (order.reviewWhatsAppSentAt) {
      reviewStatus = 'MARKED_AS_SENT';
    } else if (order.reviewWhatsAppMessageId === 'COPIED') {
      reviewStatus = 'COPIED';
    }

    const eligibleProducts = (order.items || []).map((item) => ({
      itemId: item.id,
      productId: item.productId,
      title: item.product?.title || item.productTitle || 'Product',
      slug: item.product?.slug || '',
      variantInfo: item.variantInfo,
      price: item.unitPrice,
      quantity: item.quantity,
    }));

    return NextResponse.json({
      eligible: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: rawPhone,
      normalizedPhone: normalized,
      isPhoneValid: Boolean(normalized && validatePhone(normalized)),
      status: order.status,
      eligibleProducts,
      reviewToken: token,
      reviewUrl,
      reviewStatus,
      reviewWhatsAppSentAt: order.reviewWhatsAppSentAt,
      reviewWhatsAppMessageId: order.reviewWhatsAppMessageId,
      defaultMessage,
      directWhatsAppUrl,
    });
  } catch (error: any) {
    console.error('Error fetching review WhatsApp preview:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST: Record manual dispatch status (MARK_COPIED or MARK_SENT)
 * ZERO automated Meta WhatsApp Cloud API calls are executed.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'MARK_SENT'; // 'MARK_COPIED' | 'MARK_SENT'

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: `Review requests can only be managed for DELIVERED orders. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    const rawPhone = order.customerWhatsapp || order.customerPhone || '';
    const normalized = normalizePhone(rawPhone);

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

    // Ensure review token is ready
    const { token, reviewUrl } = await getOrCreateOrderReviewToken(order.id);
    const defaultMessage = buildReviewRequestWhatsAppMessage(order.customerName, order.orderNumber, reviewUrl);
    const directWhatsAppUrl = normalized
      ? `https://wa.me/${normalized}?text=${encodeURIComponent(defaultMessage)}`
      : null;

    if (action === 'MARK_COPIED') {
      // Only set COPIED if not already marked as sent
      if (!order.reviewWhatsAppSentAt) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            reviewWhatsAppMessageId: 'COPIED',
          },
        });
      }

      return NextResponse.json({
        success: true,
        action: 'MARK_COPIED',
        reviewStatus: order.reviewWhatsAppSentAt ? 'MARKED_AS_SENT' : 'COPIED',
        reviewUrl,
        directWhatsAppUrl,
      });
    }

    // Action === 'MARK_SENT'
    const now = new Date();
    await prisma.order.update({
      where: { id: order.id },
      data: {
        reviewWhatsAppSentAt: now,
        reviewWhatsAppMessageId: 'MARKED_AS_SENT',
        timeline: {
          create: {
            status: 'DELIVERED',
            note: `Manual review invitation marked as sent to ${rawPhone || 'customer'} via WhatsApp by ${adminName}.`,
            updatedBy: adminName,
          },
        },
      },
    });

    await recordAuditLog(
      'MANUAL_WHATSAPP_REVIEW_REQUEST_SENT',
      'Order',
      order.id,
      `Manual review message marked as sent for order ${order.orderNumber} to ${rawPhone || 'customer'} by ${adminName}.`
    );

    return NextResponse.json({
      success: true,
      action: 'MARK_SENT',
      reviewStatus: 'MARKED_AS_SENT',
      sentAt: now.toISOString(),
      reviewUrl,
      directWhatsAppUrl,
    });
  } catch (error: any) {
    console.error('Error updating review WhatsApp status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
