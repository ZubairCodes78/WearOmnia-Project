import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: { take: 1, orderBy: { displayOrder: 'asc' } },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            whatsapp: true,
            email: true,
            ordersCount: true,
            totalSpent: true,
            isVIP: true,
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        shipments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mark as read by admin if unread
    if (!order.isReadByAdmin) {
      await prisma.order.update({
        where: { id: order.id },
        data: { isReadByAdmin: true },
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[Admin Order Detail API Error]', error);
    return NextResponse.json({ error: 'Failed to fetch order detail' }, { status: 500 });
  }
}
