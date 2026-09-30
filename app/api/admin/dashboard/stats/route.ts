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
      pendingOrdersCount,
      confirmedOrdersCount,
      preOrdersCount,
      pendingPaymentsCount,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      // 1. Today's orders
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // 2. Pending orders
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      // 3. Confirmed orders
      prisma.order.count({
        where: { status: { in: ['CONFIRMED', 'PROCESSING'] } },
      }),
      // 4. Pre-orders
      prisma.order.count({
        where: { isPreOrder: true },
      }),
      // 5. Pending payments (Pre-orders awaiting payment review)
      prisma.order.count({
        where: {
          isPreOrder: true,
          preOrderPaymentStatus: { in: ['PAYMENT_REVIEW_PENDING', 'UNDER_REVIEW'] },
        },
      }),
      // 6. Total Revenue (sum of totalAmount for non-cancelled orders)
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      // 7. Recent 5 orders for fast preview
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
        pendingOrders: pendingOrdersCount,
        confirmedOrders: confirmedOrdersCount,
        preOrders: preOrdersCount,
        pendingPayments: pendingPaymentsCount,
        totalRevenue: revenueResult._sum.totalAmount || 0,
      },
      recentOrders,
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
