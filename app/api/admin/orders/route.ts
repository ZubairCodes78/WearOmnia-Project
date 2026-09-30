import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const isAuthed = await verifyAdminSession(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const paymentStatus = searchParams.get('paymentStatus');
    const isPreOrderParam = searchParams.get('isPreOrder');
    const shipmentStatus = searchParams.get('shipmentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.preOrderPaymentStatus = paymentStatus;
    }

    if (isPreOrderParam === 'true') {
      where.isPreOrder = true;
    } else if (isPreOrderParam === 'false') {
      where.isPreOrder = false;
    }

    if (shipmentStatus === 'SHIPPED') {
      where.trackingNumber = { not: null };
    } else if (shipmentStatus === 'UNSHIPPED') {
      where.trackingNumber = null;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { shippingCity: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByField = ['createdAt', 'totalAmount', 'orderNumber'].includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { [orderByField]: sortOrder },
        skip,
        take: limit,
        include: {
          items: {
            take: 2,
            select: {
              id: true,
              productTitle: true,
              variantInfo: true,
              quantity: true,
              unitPrice: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Orders API Error]', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
