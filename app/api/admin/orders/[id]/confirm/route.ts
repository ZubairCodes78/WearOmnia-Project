import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency: If already confirmed, return success immediately
    if (order.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Order is already confirmed.',
        order,
      });
    }

    // Check pre-order rule: Pre-orders must have payment approved first
    if (order.isPreOrder && order.preOrderPaymentStatus !== 'PAYMENT_APPROVED') {
      return NextResponse.json(
        { error: 'Cannot confirm pre-order: Payment proof screenshot must be verified and approved first.' },
        { status: 400 }
      );
    }

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

    const now = new Date();

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: now,
        confirmedBy: adminName,
        timeline: {
          create: {
            status: 'CONFIRMED',
            note: `Order manually inspected and confirmed by ${adminName}. Eligible for WhatsApp confirmation and PostEx dispatch.`,
            updatedBy: adminName,
          },
        },
      },
    });

    await recordAuditLog(
      'ORDER_CONFIRMED',
      'Order',
      order.id,
      `Order ${order.orderNumber} manually confirmed by ${adminName}.`
    );

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} successfully confirmed.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error confirming order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to confirm order' },
      { status: 500 }
    );
  }
}
