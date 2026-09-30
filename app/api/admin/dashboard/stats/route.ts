import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSessionWithDevice } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized) {
      if (auth.isRevoked) {
        return NextResponse.json({ error: 'DEVICE_REVOKED', message: 'Device has been revoked.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      todayOrdersCount,
      todayRevenueResult,
      totalRevenueResult,
      pendingOrdersCount,
      awaitingConfirmationCount,
      confirmedOrdersCount,
      preOrdersCount,
      pendingPaymentsCount,
      readyForShipmentCount,
      shipmentsCreatedCount,
      dispatchedOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      rtoOrdersCount,
      codPendingResult,
      recentNotifications,
      recentOrders,
    ] = await Promise.all([
      // 1. Today's orders count
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // 2. Today's revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),
      // 3. Total revenue
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      // 4. Pending orders
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      // 5. Awaiting confirmation (PENDING and confirmedAt is null)
      prisma.order.count({
        where: { status: 'PENDING', confirmedAt: null },
      }),
      // 6. Confirmed orders
      prisma.order.count({
        where: { status: 'CONFIRMED' },
      }),
      // 7. Pre-orders total
      prisma.order.count({
        where: { isPreOrder: true },
      }),
      // 8. Payment proofs awaiting review
      prisma.order.count({
        where: {
          isPreOrder: true,
          preOrderPaymentStatus: { in: ['PAYMENT_REVIEW_PENDING', 'UNDER_REVIEW'] },
        },
      }),
      // 9. Ready for shipment (CONFIRMED and trackingNumber is null)
      prisma.order.count({
        where: { status: 'CONFIRMED', trackingNumber: null },
      }),
      // 10. Shipments created (trackingNumber is not null, not delivered or cancelled)
      prisma.order.count({
        where: {
          trackingNumber: { not: null },
          status: { in: ['CONFIRMED', 'PACKING', 'DISPATCHED', 'OUT_FOR_DELIVERY'] },
        },
      }),
      // 11. Dispatched orders
      prisma.order.count({
        where: { status: { in: ['DISPATCHED', 'OUT_FOR_DELIVERY'] } },
      }),
      // 12. Delivered orders
      prisma.order.count({
        where: { status: 'DELIVERED' },
      }),
      // 13. Cancelled orders
      prisma.order.count({
        where: { status: 'CANCELLED' },
      }),
      // 14. Returned / RTO orders
      prisma.order.count({
        where: { status: 'RETURNED' },
      }),
      // 15. COD pending amount (COD orders not delivered, returned, or cancelled)
      prisma.order.aggregate({
        where: {
          paymentMethod: 'CASH_ON_DELIVERY',
          status: { in: ['PENDING', 'CONFIRMED', 'PACKING', 'DISPATCHED', 'OUT_FOR_DELIVERY'] },
        },
        _sum: { totalAmount: true },
      }),
      // 16. Recent 5 notifications
      prisma.adminNotification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      }),
      // 17. Recent 5 orders for fast preview
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          totalAmount: true,
          status: true,
          paymentMethod: true,
          amountPaid: true,
          preOrderPaymentStatus: true,
          isPreOrder: true,
          trackingNumber: true,
          courier: true,
          createdAt: true,
          items: {
            take: 2,
            select: {
              productTitle: true,
              quantity: true,
              subtotal: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        todayOrders: todayOrdersCount,
        todayRevenue: todayRevenueResult._sum.totalAmount || 0,
        totalRevenue: totalRevenueResult._sum.totalAmount || 0,
        pendingOrders: pendingOrdersCount,
        newOrders: pendingOrdersCount,
        awaitingConfirmation: awaitingConfirmationCount,
        confirmedOrders: confirmedOrdersCount,
        preOrders: preOrdersCount,
        pendingPayments: pendingPaymentsCount,
        paymentProofsAwaitingReview: pendingPaymentsCount,
        readyForShipment: readyForShipmentCount,
        shipmentsCreated: shipmentsCreatedCount,
        dispatchedOrders: dispatchedOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        rtoOrders: rtoOrdersCount,
        codPendingAmount: codPendingResult._sum.totalAmount || 0,
      },
      recentNotifications,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
