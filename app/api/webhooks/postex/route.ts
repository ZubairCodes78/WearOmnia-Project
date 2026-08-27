import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';

export async function POST(req: Request) {
  try {
    const settings = await getSiteSettings();
    
    // Webhook security header/token verification
    const expectedToken = process.env.POSTEX_API_TOKEN || settings.postex_api_token;
    const authHeader = req.headers.get('authorization') || req.headers.get('x-postex-token') || req.headers.get('token');
    
    if (expectedToken && authHeader && authHeader !== expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized webhook trigger' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    
    // Status mapping adapter layer
    // Maps PostEx status strings to WearOMNIA internal status enum
    const rawStatus = (payload.status || payload.orderStatus || payload.order_status || '').trim();
    const trackingNumber = payload.trackingNumber || payload.trackingNo || payload.tracking_id;
    const orderNumber = payload.orderRef || payload.orderNumber || payload.orderRefNumber || payload.merchantOrderId;

    if (!trackingNumber && !orderNumber) {
      return NextResponse.json({ message: 'PostEx webhook received successfully (No order identifier provided).' });
    }

    // Official PostEx status mapping helper
    const upperStatus = rawStatus.toUpperCase();
    let mappedOrderStatus = 'DISPATCHED';
    if (['DELIVERED', 'FULFILLED', 'SUCCESS'].includes(upperStatus)) {
      mappedOrderStatus = 'DELIVERED';
    } else if (['OUT_FOR_DELIVERY', 'OUT FOR DELIVERY', 'ATTEMPTED'].includes(upperStatus)) {
      mappedOrderStatus = 'OUT_FOR_DELIVERY';
    } else if (['CANCELLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(upperStatus)) {
      mappedOrderStatus = 'CANCELLED';
    } else if (['RETURNED', 'RETURN', 'RTO', 'OUT FOR RETURN', 'OUT_FOR_RETURN'].includes(upperStatus)) {
      mappedOrderStatus = 'RETURNED';
    } else if (['PICKED_UP', 'PICKED UP', 'IN_TRANSIT', 'DISPATCHED', 'POSTEX WAREHOUSE', 'POSTEXWAREHOUSE'].includes(upperStatus)) {
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
          transactionFee: payload.transactionFee ? parseFloat(payload.transactionFee) : undefined,
          taxAmount: payload.taxAmount ? parseFloat(payload.taxAmount) : undefined,
          fuelSurcharge: payload.fuelSurcharge ? parseFloat(payload.fuelSurcharge) : undefined,
          deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : undefined,
          pickupDate: payload.pickupDate ? new Date(payload.pickupDate) : undefined,
          returnDate: payload.returnDate ? new Date(payload.returnDate) : undefined,
          returnReason: payload.returnReason || undefined,
          apiResponse: JSON.stringify(payload),
        },
      });

      // Add timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: mappedOrderStatus,
          previousStatus: order.status,
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
