import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { getPaymentProofPath, paymentProofExists } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        isPreOrder: true,
        preOrderPaymentScreenshotUrl: true,
      },
    });

    if (!order || !order.isPreOrder || !order.preOrderPaymentScreenshotUrl) {
      return NextResponse.json(
        { error: 'Payment proof screenshot not found for this order' },
        { status: 404 }
      );
    }

    const filename = order.preOrderPaymentScreenshotUrl;
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return NextResponse.redirect(filename);
    }

    const exists = await paymentProofExists(filename);
    if (!exists) {
      return NextResponse.json(
        { error: 'Screenshot file does not exist on disk' },
        { status: 404 }
      );
    }

    const filePath = getPaymentProofPath(filename);
    const fileBuffer = await fs.readFile(filePath);

    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="payment-proof-${order.orderNumber}${ext}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment proof screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment proof screenshot' },
      { status: 500 }
    );
  }
}
