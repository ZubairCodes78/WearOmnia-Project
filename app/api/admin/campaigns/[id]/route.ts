import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSessionWithDevice } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { deleteFile } from '@/lib/storage';
import { formatKarachiDateTime, calculateDurationDisplay } from '@/lib/coupons';
import { getEffectiveCampaignPhase, revalidateCampaignCaches } from '@/lib/campaigns';
import { getCampaignAnalytics } from '@/lib/campaign-analytics';
import { validateCampaignPayload, generatePreviewToken } from '@/lib/campaign-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const [analytics, now] = await Promise.all([
      getCampaignAnalytics(campaign.id),
      Promise.resolve(new Date()),
    ]);
    const phase = getEffectiveCampaignPhase(campaign, now);

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        effectiveStatus: phase.effectiveStatus,
        isLive: phase.isLive,
        statusLabel: phase.label,
        durationDisplay: calculateDurationDisplay(campaign.startDate, campaign.endDate),
        formattedStartDate: formatKarachiDateTime(campaign.startDate),
        formattedEndDate: formatKarachiDateTime(campaign.endDate),
      },
      analytics,
      serverTimeMs: now.getTime(),
    });
  } catch (error: any) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch campaign details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized || !auth.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: auth.adminId },
      select: { email: true, name: true },
    });
    const adminActor = admin?.email || admin?.name || 'Admin';

    const body = await req.json();

    // Quick Lifecycle Actions
    if (body.action) {
      const action = String(body.action).toUpperCase();
      let nextStatus = existing.status;
      let nextPreviewToken = existing.previewToken;

      if (action === 'PAUSE') {
        nextStatus = 'PAUSED';
      } else if (action === 'RESUME') {
        // Restore SCHEDULED if startDate is in the future, otherwise ACTIVE
        const now = new Date();
        nextStatus =
          existing.startDate && existing.startDate.getTime() > now.getTime()
            ? 'SCHEDULED'
            : 'ACTIVE';
      } else if (action === 'ACTIVATE') {
        nextStatus = 'ACTIVE';
      } else if (action === 'COMPLETE') {
        nextStatus = 'COMPLETED';
      } else if (action === 'CANCEL') {
        nextStatus = 'CANCELLED';
      } else if (action === 'REGENERATE_PREVIEW_TOKEN') {
        nextPreviewToken = generatePreviewToken();
      } else {
        return NextResponse.json({ error: `Unsupported action "${action}".` }, { status: 400 });
      }

      const updated = await prisma.campaign.update({
        where: { id },
        data: {
          status: nextStatus,
          previewToken: nextPreviewToken,
          updatedBy: adminActor,
        },
      });

      await recordAuditLog(
        `CAMPAIGN_${action}`,
        'Campaign',
        updated.id,
        `Campaign "${updated.name}" (/sale/${updated.slug}) action ${action}: ${existing.status} -> ${updated.status} by ${adminActor}`
      );

      revalidateCampaignCaches([updated.slug]);
      const now = new Date();
      const phase = getEffectiveCampaignPhase(updated, now);

      return NextResponse.json({
        success: true,
        campaign: {
          ...updated,
          effectiveStatus: phase.effectiveStatus,
          isLive: phase.isLive,
          statusLabel: phase.label,
          durationDisplay: calculateDurationDisplay(updated.startDate, updated.endDate),
          formattedStartDate: formatKarachiDateTime(updated.startDate),
          formattedEndDate: formatKarachiDateTime(updated.endDate),
        },
      });
    }

    // Full or partial edit
    const validation = validateCampaignPayload(body, true, existing);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updates = validation.data;

    // Merged start/end sanity check when only one date field was sent
    const mergedStart = updates.startDate !== undefined ? updates.startDate : existing.startDate;
    const mergedEnd = updates.endDate !== undefined ? updates.endDate : existing.endDate;
    if (mergedStart && mergedEnd && mergedEnd.getTime() <= mergedStart.getTime()) {
      return NextResponse.json(
        { error: 'Campaign end date/time must be strictly after start date/time.' },
        { status: 400 }
      );
    }

    // Unique slug check if changing slug
    if (updates.slug && updates.slug !== existing.slug) {
      const conflict = await prisma.campaign.findUnique({ where: { slug: updates.slug } });
      if (conflict && conflict.id !== existing.id) {
        return NextResponse.json(
          { error: `URL slug "${updates.slug}" is already used by another campaign.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...updates,
        updatedBy: adminActor,
      },
    });

    await recordAuditLog(
      'CAMPAIGN_UPDATED',
      'Campaign',
      updated.id,
      `Updated campaign "${updated.name}" (/sale/${updated.slug}) | Status: ${existing.status} -> ${updated.status} | Discount: ${updated.discountType} ${updated.discountValue} | By: ${adminActor}`
    );

    revalidateCampaignCaches([existing.slug, updated.slug]);

    const now = new Date();
    const phase = getEffectiveCampaignPhase(updated, now);

    return NextResponse.json({
      success: true,
      campaign: {
        ...updated,
        effectiveStatus: phase.effectiveStatus,
        isLive: phase.isLive,
        statusLabel: phase.label,
        durationDisplay: calculateDurationDisplay(updated.startDate, updated.endDate),
        formattedStartDate: formatKarachiDateTime(updated.startDate),
        formattedEndDate: formatKarachiDateTime(updated.endDate),
      },
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized || !auth.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: auth.adminId },
      select: { email: true, name: true },
    });
    const adminActor = admin?.email || admin?.name || 'Admin';

    // Historical order records preserve snapshots (`campaignName`, `campaignSlug`, `campaignDiscountAmount`)
    // Clean up R2 banner assets if any
    if (existing.desktopBannerUrl) {
      await deleteFile(existing.desktopBannerUrl).catch(() => {});
    }
    if (existing.mobileBannerUrl) {
      await deleteFile(existing.mobileBannerUrl).catch(() => {});
    }

    await prisma.campaign.delete({ where: { id } });

    await recordAuditLog(
      'CAMPAIGN_DELETED',
      'Campaign',
      id,
      `Deleted campaign "${existing.name}" (/sale/${existing.slug}) by ${adminActor}`
    );

    revalidateCampaignCaches([existing.slug]);

    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

