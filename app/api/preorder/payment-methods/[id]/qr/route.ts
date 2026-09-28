import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getQrCodePath } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const method = await prisma.preOrderPaymentMethod.findUnique({
      where: { id },
      select: { qrCodeImagePath: true, isActive: true },
    });

    if (!method || !method.qrCodeImagePath) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
    }

    if (method.qrCodeImagePath.startsWith('http://') || method.qrCodeImagePath.startsWith('https://')) {
      return NextResponse.redirect(method.qrCodeImagePath);
    }

    const filePath = getQrCodePath(method.qrCodeImagePath);
    const fileBuffer = await fs.readFile(filePath);

    const ext = path.extname(method.qrCodeImagePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = mimeMap[ext] || 'image/png';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'QR image not available' }, { status: 404 });
  }
}
