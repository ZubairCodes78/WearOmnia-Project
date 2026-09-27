import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { getPreOrderSettings, updatePreOrderSettings } from '@/lib/settings';
import { recordAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getPreOrderSettings();
    const activeCount = await prisma.preOrderPaymentMethod.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      settings,
      activePaymentMethodsCount: activeCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load pre-order settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { preorder_enabled, preorder_advance_percent, preorder_payment_instructions } = body;

    // Validation: if enabling, ensure at least one active payment method exists
    if (preorder_enabled) {
      const activeCount = await prisma.preOrderPaymentMethod.count({
        where: { isActive: true },
      });
      if (activeCount === 0) {
        return NextResponse.json(
          {
            error:
              'Cannot enable pre-orders without at least one active payment method. Please add and activate a payment method first.',
          },
          { status: 400 }
        );
      }
    }

    const percent = Number(preorder_advance_percent);
    if (isNaN(percent) || percent < 1 || percent > 100) {
      return NextResponse.json(
        { error: 'Advance payment percentage must be between 1% and 100%' },
        { status: 400 }
      );
    }

    const updated = await updatePreOrderSettings({
      preorder_enabled: Boolean(preorder_enabled),
      preorder_advance_percent: Math.round(percent),
      preorder_payment_instructions: String(preorder_payment_instructions || '').trim(),
    });

    await recordAuditLog(
      'UPDATE_PREORDER_SETTINGS',
      'SiteSettings',
      'preorder_config',
      `Updated Pre-Order settings: enabled=${updated.preorder_enabled}, advance=${updated.preorder_advance_percent}%`
    );

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: any) {
    console.error('Error updating pre-order settings:', error);
    return NextResponse.json({ error: 'Failed to update pre-order settings' }, { status: 500 });
  }
}
