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

    const { shipmentId, confirmation } = await req.json();

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

    // Safety constraint: Prevent hard deletion of legitimate production delivered or active shipments
    const isFailedOrTest =
      shipment.status === 'FAILED' ||
      shipment.status === 'ARCHIVED' ||
      shipment.trackingNumber === null ||
      shipment.trackingNumber.startsWith('TEST-');

    if (!isFailedOrTest && confirmation !== 'CONFIRM_DELETE_RECORD') {
      return NextResponse.json(
        {
          error:
            'This shipment has an active or recorded status on courier. Please use [Archive Shipment] instead of deletion to preserve operational history, or provide explicit confirmation.',
          requiresArchiveOrConfirmation: true,
        },
        { status: 400 }
      );
    }

    // Perform isolated deletion of this single shipment row
    // Order, Customer, OrderItems, InventoryLogs are 100% preserved
    await prisma.shipment.delete({
      where: { id: shipmentId },
    });

    // If order was pointing to this failed/test tracking number, clean up order tracking fields
    if (shipment.order && (shipment.order.trackingNumber === shipment.trackingNumber || !shipment.trackingNumber)) {
      // Check if order has any other active shipment
      const remainingActiveShipment = await prisma.shipment.findFirst({
        where: {
          orderId: shipment.orderId,
          status: { notIn: ['FAILED', 'CANCELLED', 'ARCHIVED', 'Un-Assigned By Me'] },
        },
      });

      if (!remainingActiveShipment) {
        await prisma.order.update({
          where: { id: shipment.orderId },
          data: {
            trackingNumber: null,
            courier: null,
          },
        });
      }
    }

    // Record audit log
    await recordAuditLog(
      'TEST_SHIPMENT_REMOVED',
      'Shipment',
      shipment.id,
      `Removed test/failed shipment record (Status: ${shipment.status}, Tracking: ${shipment.trackingNumber || 'None'}) for order #${shipment.order?.orderNumber || shipment.orderId}.`
    );

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
      message: 'Test shipment record removed safely.',
    });
  } catch (error: any) {
    console.error('Delete test shipment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to remove test shipment.' },
      { status: 500 }
    );
  }
}
