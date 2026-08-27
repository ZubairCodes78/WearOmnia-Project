import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';
import { recordAuditLog } from '@/lib/audit';

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
    let targetOrder = null;

    if (orderId) {
      targetOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shipments: true },
      });
      targetTracking = targetTracking || targetOrder?.trackingNumber || targetOrder?.shipments?.[0]?.trackingNumber;
    }

    if (!targetTracking) {
      return NextResponse.json({ error: 'No tracking number found to cancel.' }, { status: 404 });
    }

    // Call PostEx Cancel Order API
    const cancelRes = await postexApi.cancelOrder({
      trackingNumber: targetTracking,
      orderRefNumber: targetOrder?.orderNumber,
    });

    if (!cancelRes.success) {
      return NextResponse.json({
        error: cancelRes.message || 'PostEx API refused cancellation.',
      }, { status: 400 });
    }

    // Update Shipment in DB
    await prisma.shipment.updateMany({
      where: { trackingNumber: targetTracking },
      data: { status: 'CANCELLED' },
    });

    // If order was linked, update timeline
    if (targetOrder) {
      await prisma.orderTimeline.create({
        data: {
          orderId: targetOrder.id,
          status: targetOrder.status,
          note: `PostEx shipment #${targetTracking} cancelled.`,
          updatedBy: 'Admin',
        },
      });

      await recordAuditLog(
        'POSTEX_SHIPMENT_CANCELLED',
        'Shipment',
        targetTracking,
        `PostEx shipment #${targetTracking} for order #${targetOrder.orderNumber} cancelled by admin.`
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PostEx shipment cancelled successfully.',
    });
  } catch (error: any) {
    console.error('PostEx Cancel Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to cancel shipment' }, { status: 500 });
  }
}
