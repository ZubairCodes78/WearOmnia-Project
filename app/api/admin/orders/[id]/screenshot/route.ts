import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { getPaymentProofPath, paymentProofExists, isR2Configured, getR2Client } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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

    // 1. If stored in Cloudflare R2, stream securely via authenticated admin session
    if (isR2Configured()) {
      try {
        const publicBase = process.env.R2_PUBLIC_URL?.trim();
        let key = '';
        if (publicBase && filename.startsWith(publicBase)) {
          key = filename.slice(publicBase.length).replace(/^\/+/, '');
        } else if (filename.startsWith('http://') || filename.startsWith('https://')) {
          const urlObj = new URL(filename);
          if (
            urlObj.hostname.includes('r2.dev') ||
            (publicBase && urlObj.hostname === new URL(publicBase).hostname)
          ) {
            key = urlObj.pathname.replace(/^\/+/, '');
          }
        } else if (filename.startsWith('payment-proofs/')) {
          key = filename;
        }

        if (key) {
          const s3 = getR2Client();
          const s3Res = await s3.send(
            new GetObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME!.trim(),
              Key: key,
            })
          );
          const bytes = await s3Res.Body?.transformToByteArray();
          if (bytes) {
            const ext = path.extname(key).toLowerCase() || '.jpg';
            return new NextResponse(Buffer.from(bytes), {
              status: 200,
              headers: {
                'Content-Type': s3Res.ContentType || 'image/jpeg',
                'Content-Disposition': `inline; filename="payment-proof-${order.orderNumber}${ext}"`,
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
              },
            });
          }
        }
      } catch (err: any) {
        console.warn('R2 GetObject failed for screenshot, trying fallback redirect:', err?.message);
      }
    }

    // 2. If external HTTP/HTTPS URL (e.g. legacy Cloudinary URL or public URL)
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
