import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { shipmentId } = await req.json();

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID is required.' }, { status: 400 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment record not found.' }, { status: 404 });
    }

    // Do not archive an in-transit active shipment without admin confirming
    // Update shipment status to ARCHIVED
    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'ARCHIVED',
      },
    });

    // Record audit log
    await recordAuditLog(
      'SHIPMENT_ARCHIVED',
      'Shipment',
      shipment.id,
      `Archived shipment (Tracking: ${shipment.trackingNumber || 'N/A'}, Previous Status: ${shipment.status}) for order #${shipment.order?.orderNumber || shipment.orderId}`
    );

    // If order was pointing to this tracking number and the shipment was cancelled/failed, clean order tracking reference
    if (
      shipment.order &&
      shipment.order.trackingNumber === shipment.trackingNumber &&
      ['CANCELLED', 'FAILED', 'Un-Assigned By Me', 'ARCHIVED'].includes(shipment.status)
    ) {
      await prisma.order.update({
        where: { id: shipment.order.id },
        data: {
          trackingNumber: null,
          courier: null,
        },
      });
    }

    // Invalidate affected paths for real-time sync
    revalidatePath('/admin/shipping');
    revalidatePath('/admin/shipping/postex');
    revalidatePath('/admin/shipping/cod');
    revalidatePath('/admin/shipping/returns');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/reports');

    return NextResponse.json({
      success: true,
      message: 'Shipment archived successfully.',
      shipment: updated,
    });
  } catch (error: any) {
    console.error('Shipment archive error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to archive shipment.' },
      { status: 500 }
    );
  }
}
