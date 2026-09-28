import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPreOrderSettings } from '@/lib/settings';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const settings = await getPreOrderSettings();

    // Fetch active payment methods ordered by displayOrder
    const methods = await prisma.preOrderPaymentMethod.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        displayName: true,
        methodType: true,
        accountTitle: true,
        accountNumber: true,
        walletNumber: true,
        bankName: true,
        iban: true,
        instructions: true,
        qrCodeImagePath: true,
      },
    });

    const sanitizedMethods = methods.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      methodType: m.methodType,
      accountTitle: m.accountTitle,
      accountNumber: m.accountNumber,
      walletNumber: m.walletNumber,
      bankName: m.bankName,
      iban: m.iban,
      instructions: m.instructions,
      hasQrCode: Boolean(m.qrCodeImagePath),
    }));

    return NextResponse.json({
      success: true,
      enabled: settings.preorder_enabled,
      advancePercent: settings.preorder_advance_percent || 50,
      instructions: settings.preorder_payment_instructions || '',
      paymentMethods: sanitizedMethods,
    });
  } catch (error) {
    console.error('Error fetching public pre-order settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load pre-order configuration' },
      { status: 500 }
    );
  }
}
