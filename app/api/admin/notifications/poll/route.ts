import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            shippingCity: true,
            totalAmount: true,
          },
        },
      },
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      orderId: n.orderId || undefined,
      orderNumber: n.order?.orderNumber,
      customerName: n.order?.customerName,
      city: n.order?.shippingCity,
      amount: n.order?.totalAmount,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to poll notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
