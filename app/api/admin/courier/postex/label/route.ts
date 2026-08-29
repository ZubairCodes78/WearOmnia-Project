import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return new NextResponse('Unauthorized. Admin session required.', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trackingParam = searchParams.get('trackingNumber') || searchParams.get('trackingNumbers');
    const orderId = searchParams.get('orderId');

    let targetTracking = trackingParam;

    // If orderId is provided without tracking number, resolve tracking from database
    if (!targetTracking && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shipments: { orderBy: { createdAt: 'desc' } } },
      });
      targetTracking = order?.trackingNumber || order?.shipments?.[0]?.trackingNumber || null;
    }

    if (!targetTracking) {
      return new NextResponse('Valid PostEx tracking number is required to retrieve official Airway Bill PDF.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const list = targetTracking.split(',').map((t) => t.trim()).filter(Boolean);
    if (list.length > 10) {
      return new NextResponse('PostEx Airway Bill API allows a maximum of 10 tracking numbers per PDF request.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Call official PostEx Airway Bill PDF endpoint
    const pdfRes = await postexApi.getInvoicePdf(list);

    if (!pdfRes.success || !pdfRes.buffer) {
      return new NextResponse(
        `PostEx Official Airway Bill PDF could not be retrieved: ${pdfRes.message || 'Unknown error'}`,
        { status: 404, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const filename = list.length === 1 ? `PostEx-AWB-${list[0]}.pdf` : `PostEx-AWB-Batch-${Date.now()}.pdf`;

    return new NextResponse(pdfRes.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('PostEx Official Label Error:', error);
    return new NextResponse('Internal Server Error while generating official PostEx airway bill label', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
