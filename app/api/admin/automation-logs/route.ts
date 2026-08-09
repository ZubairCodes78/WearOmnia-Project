import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notifications/notification-service';
import { verifyAdminSession } from '@/lib/auth';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { recipientPhone: { contains: q, mode: 'insensitive' } },
        { messageType: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { order: { customerName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const logs = await prisma.notificationLog.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Automation Logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch automation logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, logId } = await req.json();

    if (action === 'RETRY' && logId) {
      const result = await NotificationService.retryFailedNotification(logId);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Retry failed' }, { status: 500 });
  }
}
