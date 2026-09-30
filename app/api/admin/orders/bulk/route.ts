import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { getCourierProvider } from '@/lib/courier';
import { isValidTransition, OrderStatus } from '@/lib/order-status';

export const runtime = 'nodejs';

interface BulkOrderRequest {
  action: 'CONFIRM' | 'CREATE_SHIPMENT' | 'UPDATE_STATUS' | 'DELETE';
  orderIds: string[];
  targetStatus?: string;
  providerName?: string;
  deleteReason?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Authentication & 2FA Session
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = (await req.json()) as BulkOrderRequest;
    const { action, orderIds, targetStatus, providerName = 'POSTEX', deleteReason } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders provided for bulk operation.' },
        { status: 400 }
      );
    }

    // Limit maximum batch size to 50 for stability and rate limits
    const cleanIds = orderIds.slice(0, 50);

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

    const results: Array<{
      orderId: string;
      orderNumber: string;
      success: boolean;
      action: string;
      message: string;
      trackingNumber?: string;
      skipped?: boolean;
    }> = [];

    let successfulCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. BULK CONFIRM ORDERS
    // ─────────────────────────────────────────────────────────────────────────────
    if (action === 'CONFIRM') {
      for (const id of cleanIds) {
        const order = await prisma.order.findUnique({
          where: { id },
        });

        if (!order) {
          results.push({
            orderId: id,
            orderNumber: 'UNKNOWN',
            success: false,
            action: 'CONFIRM',
            message: 'Order not found in database.',
          });
          failedCount++;
          continue;
        }

        // Idempotency: skip if already confirmed
        if (order.status === 'CONFIRMED') {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'CONFIRM',
            skipped: true,
            message: 'Already confirmed.',
          });
          skippedCount++;
          continue;
        }

        // Pre-order check: payment proof must be approved
        if (order.isPreOrder && order.preOrderPaymentStatus !== 'PAYMENT_APPROVED') {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CONFIRM',
            skipped: true,
            message: 'Pre-order payment proof is awaiting approval.',
          });
          skippedCount++;
          continue;
        }

        // Only PENDING orders can be confirmed
        if (order.status !== 'PENDING') {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CONFIRM',
            skipped: true,
            message: `Cannot confirm order in ${order.status} state.`,
          });
          skippedCount++;
          continue;
        }

        try {
          const now = new Date();
          await prisma.order.update({
            where: { id },
            data: {
              status: 'CONFIRMED',
              confirmedAt: now,
              confirmedBy: adminName,
              timeline: {
                create: {
                  status: 'CONFIRMED',
                  note: `Order bulk-confirmed by ${adminName}.`,
                  updatedBy: adminName,
                },
              },
            },
          });

          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'CONFIRM',
            message: 'Successfully confirmed.',
          });
          successfulCount++;
        } catch (err: any) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CONFIRM',
            message: err?.message || 'Database error during confirmation.',
          });
          failedCount++;
        }
      }

      await recordAuditLog(
        'BULK_ORDERS_CONFIRMED',
        'Order',
        cleanIds.join(','),
        `Bulk confirmed ${successfulCount} orders (${skippedCount} skipped, ${failedCount} failed) by ${adminName}.`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. BULK CREATE POSTEX SHIPMENTS
    // ─────────────────────────────────────────────────────────────────────────────
    else if (action === 'CREATE_SHIPMENT') {
      const provider = getCourierProvider(providerName);

      for (const id of cleanIds) {
        const order = await prisma.order.findUnique({
          where: { id },
          include: { items: true, shipments: { orderBy: { createdAt: 'desc' } } },
        });

        if (!order) {
          results.push({
            orderId: id,
            orderNumber: 'UNKNOWN',
            success: false,
            action: 'CREATE_SHIPMENT',
            message: 'Order not found.',
          });
          failedCount++;
          continue;
        }

        // Must be CONFIRMED or PACKING
        if (order.status !== 'CONFIRMED' && order.status !== 'PACKING') {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CREATE_SHIPMENT',
            skipped: true,
            message: `Order must be CONFIRMED first (currently ${order.status}).`,
          });
          skippedCount++;
          continue;
        }

        // Pre-order check
        if (order.isPreOrder && order.preOrderPaymentStatus !== 'PAYMENT_APPROVED') {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CREATE_SHIPMENT',
            skipped: true,
            message: 'Pre-order payment proof not approved.',
          });
          skippedCount++;
          continue;
        }

        // Duplicate check: skip if active shipment exists
        const existing = order.shipments?.find(
          (s) => s.status !== 'FAILED' && s.status !== 'CANCELLED' && Boolean(s.trackingNumber)
        );
        if (existing) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'CREATE_SHIPMENT',
            skipped: true,
            trackingNumber: existing.trackingNumber || undefined,
            message: `Already has PostEx tracking: ${existing.trackingNumber}.`,
          });
          skippedCount++;
          continue;
        }

        // Validation of address & contact
        if (!order.customerName?.trim() || !order.customerPhone?.trim() || !order.shippingAddress?.trim() || !order.shippingCity?.trim()) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CREATE_SHIPMENT',
            skipped: true,
            message: 'Missing customer shipping details (Name, Phone, Address, or City).',
          });
          skippedCount++;
          continue;
        }

        try {
          const codAmount = (order.isPreOrder && order.preOrderRemainingAmount != null)
            ? order.preOrderRemainingAmount
            : order.totalAmount;

          const shipmentResult = await provider.createShipment({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail || undefined,
            deliveryAddress: order.shippingAddress,
            destinationCityName: order.shippingCity,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
            shippingProvince: order.shippingProvince,
            codAmount,
            items: order.items.map((i) => ({
              productTitle: i.productTitle,
              variantInfo: i.variantInfo,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              subtotal: i.subtotal,
            })),
          } as any);

          if (!shipmentResult.success) {
            results.push({
              orderId: id,
              orderNumber: order.orderNumber,
              success: false,
              action: 'CREATE_SHIPMENT',
              message: shipmentResult.message || 'PostEx API booking failed.',
            });
            failedCount++;
            continue;
          }

          // Save shipment record and update order
          await prisma.$transaction(async (tx) => {
            await tx.shipment.create({
              data: {
                orderId: order.id,
                provider: providerName,
                trackingNumber: shipmentResult.trackingNumber,
                orderRefNumber: order.orderNumber,
                status: 'BOOKED',
                codAmount,
                labelUrl: shipmentResult.labelUrl,
                trackingUrl: shipmentResult.trackingUrl,
              },
            });

            await tx.order.update({
              where: { id: order.id },
              data: {
                trackingNumber: shipmentResult.trackingNumber,
                courier: providerName,
                status: 'PACKING',
                timeline: {
                  create: {
                    status: 'PACKING',
                    note: `PostEx shipment created. Tracking: ${shipmentResult.trackingNumber}.`,
                    updatedBy: adminName,
                  },
                },
              },
            });
          });

          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'CREATE_SHIPMENT',
            trackingNumber: shipmentResult.trackingNumber,
            message: `Shipment booked: ${shipmentResult.trackingNumber}.`,
          });
          successfulCount++;
        } catch (err: any) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'CREATE_SHIPMENT',
            message: err?.message || 'Error processing shipment.',
          });
          failedCount++;
        }
      }

      await recordAuditLog(
        'BULK_SHIPMENTS_CREATED',
        'Shipment',
        cleanIds.join(','),
        `Bulk created ${successfulCount} PostEx shipments (${skippedCount} skipped, ${failedCount} failed) by ${adminName}.`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. BULK UPDATE STATUS
    // ─────────────────────────────────────────────────────────────────────────────
    else if (action === 'UPDATE_STATUS') {
      if (!targetStatus) {
        return NextResponse.json(
          { error: 'Target status is required for bulk status update.' },
          { status: 400 }
        );
      }

      for (const id of cleanIds) {
        const order = await prisma.order.findUnique({
          where: { id },
        });

        if (!order) {
          results.push({
            orderId: id,
            orderNumber: 'UNKNOWN',
            success: false,
            action: 'UPDATE_STATUS',
            message: 'Order not found.',
          });
          failedCount++;
          continue;
        }

        if (order.status === targetStatus) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'UPDATE_STATUS',
            skipped: true,
            message: `Already in ${targetStatus} status.`,
          });
          skippedCount++;
          continue;
        }

        if (!isValidTransition(order.status, targetStatus)) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'UPDATE_STATUS',
            skipped: true,
            message: `Invalid transition from ${order.status} to ${targetStatus}.`,
          });
          skippedCount++;
          continue;
        }

        try {
          await prisma.order.update({
            where: { id },
            data: {
              status: targetStatus,
              timeline: {
                create: {
                  status: targetStatus,
                  previousStatus: order.status,
                  note: `Bulk status update to ${targetStatus} by ${adminName}.`,
                  updatedBy: adminName,
                },
              },
            },
          });

          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'UPDATE_STATUS',
            message: `Status updated to ${targetStatus}.`,
          });
          successfulCount++;
        } catch (err: any) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'UPDATE_STATUS',
            message: err?.message || 'Error updating status.',
          });
          failedCount++;
        }
      }

      await recordAuditLog(
        'BULK_ORDERS_STATUS_UPDATED',
        'Order',
        cleanIds.join(','),
        `Bulk updated status to ${targetStatus} for ${successfulCount} orders by ${adminName}.`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. BULK DELETE ORDERS
    // ─────────────────────────────────────────────────────────────────────────────
    else if (action === 'DELETE') {
      for (const id of cleanIds) {
        const order = await prisma.order.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!order) {
          results.push({
            orderId: id,
            orderNumber: 'UNKNOWN',
            success: false,
            action: 'DELETE',
            message: 'Order not found.',
          });
          failedCount++;
          continue;
        }

        // Disallow deleting dispatched or delivered orders without manual review
        if (order.status === 'DISPATCHED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'DELETE',
            skipped: true,
            message: `Cannot bulk delete active or completed shipment (${order.status}).`,
          });
          skippedCount++;
          continue;
        }

        try {
          // Revert product inventory if stock was deducted
          for (const item of order.items) {
            if (item.productId) {
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } },
              }).catch(() => {}); // Catch missing product gracefully
            }
          }

          // Delete dependent relations and order
          await prisma.orderTimeline.deleteMany({ where: { orderId: id } });
          await prisma.shipment.deleteMany({ where: { orderId: id } });
          await prisma.orderItem.deleteMany({ where: { orderId: id } });
          await prisma.order.delete({ where: { id } });

          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: true,
            action: 'DELETE',
            message: 'Order deleted successfully.',
          });
          successfulCount++;
        } catch (err: any) {
          results.push({
            orderId: id,
            orderNumber: order.orderNumber,
            success: false,
            action: 'DELETE',
            message: err?.message || 'Error deleting order.',
          });
          failedCount++;
        }
      }

      await recordAuditLog(
        'BULK_ORDERS_DELETED',
        'Order',
        cleanIds.join(','),
        `Bulk deleted ${successfulCount} orders (Reason: ${deleteReason || 'Admin bulk action'}) by ${adminName}.`
      );
    } else {
      return NextResponse.json(
        { error: `Unsupported bulk action: ${action}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      summary: {
        total: cleanIds.length,
        successful: successfulCount,
        skipped: skippedCount,
        failed: failedCount,
      },
      results,
    });
  } catch (error: any) {
    console.error('Error executing bulk order operation:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during bulk operation.' },
      { status: 500 }
    );
  }
}
