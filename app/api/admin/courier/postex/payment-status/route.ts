import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function POST(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { trackingNumber, orderId } = await req.json();

    if (!trackingNumber && !orderId) {
      return NextResponse.json({ error: 'Tracking number or Order ID is required' }, { status: 400 });
    }

    let targetTracking = trackingNumber;

    if (!targetTracking && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shipments: { orderBy: { createdAt: 'desc' } } },
      });
      targetTracking = order?.trackingNumber || order?.shipments?.[0]?.trackingNumber;
    }

    if (!targetTracking) {
      return NextResponse.json({ error: 'No tracking number found for this order.' }, { status: 404 });
    }

    // Call PostEx Payment Status API
    const payRes = await postexApi.getPaymentStatus(targetTracking);

    if (!payRes.success || !payRes.payment) {
      return NextResponse.json({
        error: payRes.message || 'Payment settlement status could not be retrieved from PostEx.',
      }, { status: 400 });
    }

    const p = payRes.payment;

    // Update database Shipment record with settlement info
    await prisma.shipment.updateMany({
      where: { trackingNumber: targetTracking },
      data: {
        settlementStatus: p.settlementStatus || (p.settle === 'true' || p.settle === true ? 'SETTLED' : 'PENDING'),
        settlementDate: p.settlementDate ? new Date(p.settlementDate) : undefined,
        cprNumber: p.cprNumber_1 || p.cprNumber_2 || p.cprNumber || undefined,
        upfrontPaymentDate: p.upfrontPaymentDate ? new Date(p.upfrontPaymentDate) : undefined,
        reservePaymentDate: p.reservePaymentDate ? new Date(p.reservePaymentDate) : undefined,
        transactionFee: p.transactionFee ?? undefined,
        taxAmount: p.taxAmount ?? p.tax ?? undefined,
        fuelSurcharge: p.fuelSurcharge ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        trackingNumber: p.trackingNumber || targetTracking,
        orderRefNumber: p.orderRefNumber,
        settle: p.settle,
        settlementStatus: p.settlementStatus || (p.settle === 'true' || p.settle === true ? 'SETTLED' : 'PENDING'),
        settlementDate: p.settlementDate,
        upfrontPaymentDate: p.upfrontPaymentDate,
        cprNumber_1: p.cprNumber_1,
        cprNumber_2: p.cprNumber_2,
        cprNumber: p.cprNumber_1 || p.cprNumber_2 || p.cprNumber,
        reservePaymentDate: p.reservePaymentDate,
        codAmount: p.invoicePayment,
        netAmount: p.netAmount,
        transactionFee: p.transactionFee,
        taxAmount: p.taxAmount || p.tax,
        fuelSurcharge: p.fuelSurcharge,
      },
      message: 'Settlement details retrieved and updated.',
    });
  } catch (error: any) {
    console.error('PostEx Payment Status Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch payment status' }, { status: 500 });
  }
}
