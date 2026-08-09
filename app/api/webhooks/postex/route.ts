import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';

export async function POST(req: Request) {
  try {
    const settings = await getSiteSettings();
    
    // Webhook security header/token verification
    const authHeader = req.headers.get('authorization') || req.headers.get('x-postex-token');
    if (settings.postex_api_token && authHeader !== settings.postex_api_token) {
      // Allow request if token is unconfigured or matches
      if (settings.postex_enabled && settings.postex_api_token) {
        return NextResponse.json({ error: 'Unauthorized webhook trigger' }, { status: 401 });
      }
    }

    const payload = await req.json().catch(() => ({}));
    
    // Status mapping adapter layer
    // Maps PostEx status strings to WearOMNIA internal status enum
    const rawStatus = (payload.status || payload.orderStatus || '').toUpperCase();
    const trackingNumber = payload.trackingNumber || payload.trackingNo || payload.tracking_id;
    const orderNumber = payload.orderRef || payload.orderNumber || payload.merchantOrderId;

    if (!trackingNumber && !orderNumber) {
      return NextResponse.json({ message: 'PostEx webhook received successfully (No order identifier provided).' });
    }

    // Official PostEx status mapping helper
    let mappedOrderStatus = 'DISPATCHED';
    if (['DELIVERED', 'FULFILLED', 'SUCCESS'].includes(rawStatus)) {
      mappedOrderStatus = 'DELIVERED';
    } else if (['OUT_FOR_DELIVERY', 'OUT FOR DELIVERY'].includes(rawStatus)) {
      mappedOrderStatus = 'OUT_FOR_DELIVERY';
    } else if (['CANCELLED', 'CANCELED', 'REJECTED'].includes(rawStatus)) {
      mappedOrderStatus = 'CANCELLED';
    } else if (['RETURNED', 'RETURN', 'RTO'].includes(rawStatus)) {
      mappedOrderStatus = 'RETURNED';
    } else if (['PICKED_UP', 'PICKED UP', 'IN_TRANSIT', 'DISPATCHED'].includes(rawStatus)) {
      mappedOrderStatus = 'DISPATCHED';
    }

    // Find Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderNumber ? [{ orderNumber }] : []),
          ...(trackingNumber ? [{ trackingNumber }] : []),
        ],
      },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: mappedOrderStatus,
          trackingNumber: trackingNumber || order.trackingNumber,
        },
      });

      // Update active shipment record
      await prisma.shipment.updateMany({
        where: { orderId: order.id },
        data: {
          status: rawStatus || mappedOrderStatus,
          trackingNumber: trackingNumber || undefined,
        },
      });

      // Add timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: mappedOrderStatus,
          note: `Status updated via PostEx Webhook (${rawStatus || mappedOrderStatus})`,
          updatedBy: 'PostEx Webhook',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'PostEx Webhook processed successfully',
    });
  } catch (error: any) {
    console.error('PostEx Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: 'PostEx Webhook endpoint is active and ready.' });
}
