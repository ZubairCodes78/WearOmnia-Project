import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';
import { POSTEX_STATUS_MAP } from '@/lib/courier/types';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackingNumber, orderId } = await req.json();

    if (!trackingNumber && !orderId) {
      return NextResponse.json({ error: 'Tracking number or Order ID is required' }, { status: 400 });
    }

    let targetTracking = trackingNumber;

    // Look up tracking number if only orderId was provided
    if (!targetTracking && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shipments: { orderBy: { createdAt: 'desc' } } },
      });
      targetTracking = order?.trackingNumber || order?.shipments?.[0]?.trackingNumber;
    }

    if (!targetTracking) {
      return NextResponse.json({ error: 'No tracking number found for this order.' }, { status: 404 });
    }

    // Call PostEx Track Order API
    const trackRes = await postexApi.trackOrder(targetTracking);

    if (!trackRes.success || !trackRes.tracking) {
      return NextResponse.json({
        error: trackRes.message || 'Tracking information could not be retrieved from PostEx.',
      }, { status: 400 });
    }

    const t = trackRes.tracking;
    const rawStatus = t.orderStatus || t.transactionStatus || 'Booked';
    const mapped = POSTEX_STATUS_MAP[rawStatus] || { orderStatus: 'DISPATCHED' };

    // Update database shipment & order if orderId or matching trackingNumber exists
    const matchingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          { trackingNumber: targetTracking },
          { shipments: { some: { trackingNumber: targetTracking } } },
        ],
      },
    });

    if (matchingOrder) {
      // Update shipments
      await prisma.shipment.updateMany({
        where: { orderId: matchingOrder.id, trackingNumber: targetTracking },
        data: {
          status: rawStatus,
          transactionFee: t.transactionFee ?? undefined,
          fuelSurcharge: t.fuelSurcharge ?? undefined,
          taxAmount: t.taxAmount ?? undefined,
          pickupDate: t.pickupDate ? new Date(t.pickupDate) : undefined,
          deliveryDate: t.deliveryDate ? new Date(t.deliveryDate) : undefined,
          returnDate: t.returnDate ? new Date(t.returnDate) : undefined,
          returnReason: t.returnReason ?? undefined,
          apiResponse: JSON.stringify(trackRes.raw || {}),
        },
      });

      // Update order status if PostEx status implies advancement
      if (mapped.orderStatus && mapped.orderStatus !== matchingOrder.status) {
        await prisma.order.update({
          where: { id: matchingOrder.id },
          data: { status: mapped.orderStatus },
        });

        await prisma.orderTimeline.create({
          data: {
            orderId: matchingOrder.id,
            status: mapped.orderStatus,
            previousStatus: matchingOrder.status,
            note: `Status refreshed from PostEx: ${rawStatus}`,
            updatedBy: 'PostEx Sync',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      tracking: {
        trackingNumber: t.trackingNumber || targetTracking,
        orderRefNumber: t.orderRefNumber,
        status: mapped.orderStatus,
        rawStatus: rawStatus,
        statusDetails: t.transactionStatus || rawStatus,
        pickupDate: t.pickupDate,
        deliveryDate: t.deliveryDate,
        returnDate: t.returnDate,
        returnReason: t.returnReason,
        transactionFee: t.transactionFee,
        taxAmount: t.taxAmount,
        fuelSurcharge: t.fuelSurcharge,
        history: t.history || [],
      },
      message: 'Tracking information refreshed successfully.',
    });
  } catch (error: any) {
    console.error('PostEx Track Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to track shipment' }, { status: 500 });
  }
}
