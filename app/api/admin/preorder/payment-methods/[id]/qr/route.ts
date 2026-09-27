import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { saveQrCode } from '@/lib/storage';
import { recordAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const method = await prisma.preOrderPaymentMethod.findUnique({
      where: { id },
    });

    if (!method) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saveResult = await saveQrCode(buffer, file.type || 'image/png');

    if (!saveResult.success || !saveResult.filename) {
      return NextResponse.json({ error: saveResult.error || 'Failed to save QR code image' }, { status: 400 });
    }

    const updated = await prisma.preOrderPaymentMethod.update({
      where: { id },
      data: { qrCodeImagePath: saveResult.filename },
    });

    await recordAuditLog(
      'UPDATE_PAYMENT_METHOD_QR',
      'PreOrderPaymentMethod',
      id,
      `Uploaded QR Code for ${method.displayName}`
    );

    return NextResponse.json({ success: true, qrCodeImagePath: saveResult.filename });
  } catch (error: any) {
    console.error('Error uploading payment method QR:', error);
    return NextResponse.json({ error: 'Failed to upload QR code' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.preOrderPaymentMethod.update({
      where: { id },
      data: { qrCodeImagePath: null },
    });

    await recordAuditLog(
      'DELETE_PAYMENT_METHOD_QR',
      'PreOrderPaymentMethod',
      id,
      `Removed QR Code for payment method ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to remove QR code' }, { status: 500 });
  }
}
