import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const isVip = searchParams.get('isVIP');

    const customers = await prisma.customer.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { city: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(isVip === 'true' ? { isVIP: true } : isVip === 'false' ? { isVIP: false } : {}),
      },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { totalSpent: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, isVIP, customerNotes } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(typeof isVIP === 'boolean' ? { isVIP } : {}),
        ...(typeof customerNotes === 'string' ? { customerNotes } : {}),
      },
    });

    await recordAuditLog(
      'CUSTOMER_UPDATED',
      'Customer',
      customerId,
      `Updated customer ${updated.fullName || updated.phone}. VIP: ${updated.isVIP}`
    );

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update customer' }, { status: 500 });
  }
}
