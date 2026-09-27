import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';
import { PDFDocument } from 'pdf-lib';

/**
 * Helper to fetch official PostEx PDF for up to 10 tracking numbers
 */
async function fetchChunkPdf(chunk: string[]): Promise<ArrayBuffer | null> {
  const res = await postexApi.getInvoicePdf(chunk);
  if (res.success && res.buffer) {
    return res.buffer;
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return new NextResponse('Unauthorized. Admin session required.', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trackingParam = searchParams.get('trackingNumber') || searchParams.get('trackingNumbers');
    const orderId = searchParams.get('orderId');
    const orderIdsParam = searchParams.get('orderIds');

    let trackingList: string[] = [];

    if (orderIdsParam) {
      const orderIds = orderIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { shipments: { orderBy: { createdAt: 'desc' } } },
      });
      // Keep order of request
      for (const id of orderIds) {
        const order = orders.find((o) => o.id === id);
        const t = order?.trackingNumber || order?.shipments?.[0]?.trackingNumber;
        if (t) trackingList.push(t.trim());
      }
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shipments: { orderBy: { createdAt: 'desc' } } },
      });
      const t = order?.trackingNumber || order?.shipments?.[0]?.trackingNumber;
      if (t) trackingList.push(t.trim());
    } else if (trackingParam) {
      trackingList = trackingParam.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (trackingList.length === 0) {
      return new NextResponse('Valid PostEx tracking number or order with tracking number is required.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Single tracking number fast-path (no merge needed)
    if (trackingList.length === 1) {
      const pdfRes = await postexApi.getInvoicePdf(trackingList[0]);
      if (!pdfRes.success || !pdfRes.buffer) {
        return new NextResponse(
          `PostEx Official Airway Bill PDF could not be retrieved: ${pdfRes.message || 'Unknown error'}`,
          { status: 404, headers: { 'Content-Type': 'text/plain' } }
        );
      }
      return new NextResponse(pdfRes.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="PostEx-AWB-${trackingList[0]}.pdf"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Multi-tracking batching (PostEx supports up to 10 per request; combine using pdf-lib)
    const chunks: string[][] = [];
    for (let i = 0; i < trackingList.length; i += 10) {
      chunks.push(trackingList.slice(i, i + 10));
    }

    const mergedPdf = await PDFDocument.create();
    let totalPagesMerged = 0;

    for (const chunk of chunks) {
      const buffer = await fetchChunkPdf(chunk);
      if (buffer) {
        const doc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        totalPagesMerged += copiedPages.length;
      }
    }

    if (totalPagesMerged === 0) {
      return new NextResponse('Could not retrieve PostEx labels for any of the requested tracking numbers.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const finalPdfBytes = await mergedPdf.save();
    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="PostEx-AWB-Batch-${Date.now()}.pdf"`,
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

