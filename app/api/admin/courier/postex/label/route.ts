import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';

export async function GET(req: Request) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return new NextResponse('Unauthorized. Admin session required.', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trackingNumber = searchParams.get('trackingNumber') || searchParams.get('trackingNumbers');

    if (!trackingNumber) {
      return new NextResponse('Tracking number is required', { status: 400 });
    }

    // Call official PostEx Airway Bill PDF API
    const pdfRes = await postexApi.getInvoicePdf(trackingNumber);

    if (!pdfRes.success || !pdfRes.buffer) {
      return new NextResponse(
        `Failed to retrieve PostEx Airway Bill PDF: ${pdfRes.message || 'Unknown error'}`,
        { status: 404, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    return new NextResponse(pdfRes.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="PostEx-AWB-${trackingNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('PostEx Label Error:', error);
    return new NextResponse('Internal Server Error while generating PostEx label', { status: 500 });
  }
}
