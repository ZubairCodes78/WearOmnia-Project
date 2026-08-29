import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { postexApi } from '@/lib/courier/postex-api';
import { broadcastAdminEvent } from '@/lib/events/event-emitter';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { orderId, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    // 1. Fetch complete order details including items, customer, shipments
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shipments: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or already deleted.' }, { status: 404 });
    }

    const orderNumber = order.orderNumber;
    const customerId = order.customerId;
    const customerName = order.customerName || order.customer?.fullName || 'Customer';
    const totalAmount = order.totalAmount;

    // 2. PostEx Shipment Safety & Cancellation
    // If order has an active PostEx shipment, cancel it via PostEx API first
    for (const shipment of order.shipments) {
      if (shipment.provider === 'POSTEX' && shipment.trackingNumber) {
        const isInactiveOrCancelled = [
          'FAILED',
          'CANCELLED',
          'ARCHIVED',
          'Un-Assigned By Me',
          'Expired',
        ].includes(shipment.status);

        if (!isInactiveOrCancelled) {
          try {
            const cancelRes = await postexApi.cancelOrder(shipment.trackingNumber);
            if (!cancelRes.success) {
              console.warn(
                `[PostEx Cancel on Delete] Note for tracking #${shipment.trackingNumber}: ${cancelRes.message}`
              );
            }
          } catch (postexErr) {
            console.error('[PostEx Cancel on Delete Error]', postexErr);
          }
        }
      }
    }

    // 3. Inventory Stock Reversal
    // Reverse deducted inventory for all items in this order
    for (const item of order.items) {
      if (item.productId && item.quantity > 0) {
        try {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, stockQuantity: true },
          });

          if (product) {
            const updatedProd = await prisma.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: { increment: item.quantity },
                inStock: true,
              },
            });

            await prisma.inventoryLog.create({
              data: {
                productId: item.productId,
                changeQuantity: item.quantity,
                stockAfter: updatedProd.stockQuantity,
                reason: 'ORDER_DELETED',
              },
            });
          }
        } catch (invErr) {
          console.error(`[Inventory Reversal Error] item ${item.id}:`, invErr);
        }
      }
    }

    // 4. Coupon Usage Rollback
    if (order.couponCode) {
      try {
        const coupon = await prisma.coupon.findUnique({
          where: { code: order.couponCode },
        });
        if (coupon && coupon.usedCount > 0) {
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { decrement: 1 } },
          });
        }
      } catch (couponErr) {
        console.error('[Coupon Rollback Error]', couponErr);
      }
    }

    // 5. Hard Delete the Order Record from Database
    // Cascades automatically delete OrderItem, Shipment, OrderTimeline, AdminNotification, NotificationLog
    await prisma.order.delete({
      where: { id: orderId },
    });

    // 6. Recalculate and Update Customer Metrics (Customer Profile is 100% RETAINED)
    if (customerId) {
      try {
        const remainingOrders = await prisma.order.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
        });

        const newOrdersCount = remainingOrders.length;
        const validRemainingOrders = remainingOrders.filter((o) => o.status !== 'CANCELLED');
        const newTotalSpent = validRemainingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const newAOV = newOrdersCount > 0 ? Math.round(newTotalSpent / newOrdersCount) : 0;
        const newLastOrderDate = remainingOrders.length > 0 ? remainingOrders[0].createdAt : null;
        const newIsVIP = newTotalSpent > 40000;

        await prisma.customer.update({
          where: { id: customerId },
          data: {
            ordersCount: newOrdersCount,
            totalSpent: newTotalSpent,
            averageOrderValue: newAOV,
            lastOrderDate: newLastOrderDate,
            isVIP: newIsVIP,
          },
        });
      } catch (custErr) {
        console.error('[Customer Recalculation Error]', custErr);
      }
    }

    // 7. Security & Accountability Audit Log
    // Record permanent audit entry with deletion rationale
    await recordAuditLog(
      'ORDER_DELETED',
      'Order',
      orderId,
      `Order #${orderNumber} (Customer: ${customerName}, Amount: Rs. ${totalAmount.toLocaleString()}) permanently deleted from business records. Reason: ${reason || 'Cancelled/Test Order'}.`
    );

    // 8. Real-Time Admin SSE Stream Broadcast
    broadcastAdminEvent({
      type: 'ORDER_DELETED',
      order: { id: orderId, orderNumber },
      timestamp: new Date().toISOString(),
    });

    // 9. Revalidate Next.js Cached Server Pages
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/customers');
    revalidatePath('/admin/reports');
    revalidatePath('/admin/shipping');
    revalidatePath('/admin/shipping/postex');
    revalidatePath('/admin/shipping/cod');
    revalidatePath('/admin/shipping/returns');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/inventory/logs');

    return NextResponse.json({
      success: true,
      message: `Order #${orderNumber} deleted permanently. Customer profile retained.`,
      orderNumber,
    });
  } catch (error: any) {
    console.error('[Delete Order Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete order.' },
      { status: 500 }
    );
  }
}
