import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
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
    const {
      preorder_enabled,
      preorder_advance_percent,
      preorder_advance_enabled,
      preorder_payment_instructions,
    } = body;

    const isEnabled = Boolean(preorder_enabled);
    const advanceEnabled = preorder_advance_enabled !== undefined ? Boolean(preorder_advance_enabled) : true;

    // Validation: if preorders AND advance payment are enabled, ensure at least one active payment method exists
    if (isEnabled && advanceEnabled) {
      const activeCount = await prisma.preOrderPaymentMethod.count({
        where: { isActive: true },
      });
      if (activeCount === 0) {
        return NextResponse.json(
          {
            error:
              'Cannot require advance payments without at least one active payment method. Please add and activate a payment method first, or disable the advance payment requirement.',
          },
          { status: 400 }
        );
      }
    }

    let percent = Number(preorder_advance_percent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return NextResponse.json(
        { error: 'Advance payment percentage must be between 0% and 100%' },
        { status: 400 }
      );
    }

    if (advanceEnabled && percent === 0) {
      percent = 50; // fallback standard rate if advance is enabled
    }

    const updated = await updatePreOrderSettings({
      preorder_enabled: isEnabled,
      preorder_advance_enabled: advanceEnabled && percent > 0,
      preorder_advance_percent: advanceEnabled ? Math.round(percent) : 0,
      preorder_payment_instructions: String(preorder_payment_instructions || '').trim(),
    });

    await recordAuditLog(
      'UPDATE_PREORDER_SETTINGS',
      'SiteSettings',
      'preorder_config',
      `Updated Pre-Order settings: enabled=${updated.preorder_enabled}, advance_enabled=${updated.preorder_advance_enabled}, advance=${updated.preorder_advance_percent}%`
    );

    // Purge both the page cache and the unstable_cache data layer so
    // storefront immediately sees updated preorder settings (not after 120s TTL)
    try {
      revalidateTag('preorder-settings');
      revalidateTag('site-settings');
      revalidatePath('/', 'layout');
      revalidatePath('/shop');
      revalidatePath('/checkout');
    } catch {
      // Ignored in non-SSR test environments
    }

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: any) {
    console.error('Error updating pre-order settings:', error);
    return NextResponse.json({ error: 'Failed to update pre-order settings' }, { status: 500 });
  }
}
