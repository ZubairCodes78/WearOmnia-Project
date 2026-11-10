import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSessionWithDevice } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { formatKarachiDateTime, calculateDurationDisplay } from '@/lib/coupons';
import {
  getEffectiveCampaignPhase,
  revalidateCampaignCaches,
} from '@/lib/campaigns';
import {
  validateCampaignPayload,
  generatePreviewToken,
  sanitizeCampaignSlug,
} from '@/lib/campaign-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function enrichCampaignForAdmin(c: any, now: Date) {
  const phase = getEffectiveCampaignPhase(c, now);
  return {
    ...c,
    effectiveStatus: phase.effectiveStatus,
    isLive: phase.isLive,
    statusLabel: phase.label,
    startsInMs: phase.startsInMs,
    endsInMs: phase.endsInMs,
    durationDisplay: calculateDurationDisplay(c.startDate, c.endDate),
    formattedStartDate: formatKarachiDateTime(c.startDate),
    formattedEndDate: formatKarachiDateTime(c.endDate),
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [campaigns, ordersWithCampaigns] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { campaignId: { not: null } },
            { campaignIds: { isEmpty: false } },
          ],
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        select: {
          id: true,
          campaignId: true,
          campaignIds: true,
          totalAmount: true,
          campaignDiscountAmount: true,
        },
      }),
    ]);

    const summaryMap = new Map<string, { ordersCount: number; netRevenue: number; discountGranted: number }>();
    for (const o of ordersWithCampaigns) {
      const ids = new Set<string>([
        ...(o.campaignId ? [o.campaignId] : []),
        ...(Array.isArray(o.campaignIds) ? o.campaignIds : []),
      ]);
      for (const cid of ids) {
        const cur = summaryMap.get(cid) || { ordersCount: 0, netRevenue: 0, discountGranted: 0 };
        cur.ordersCount += 1;
        cur.netRevenue += Number(o.totalAmount) || 0;
        cur.discountGranted += Number(o.campaignDiscountAmount) || 0;
        summaryMap.set(cid, cur);
      }
    }

    const now = new Date();
    const enriched = campaigns.map((c) => ({
      ...enrichCampaignForAdmin(c, now),
      analyticsSummary: summaryMap.get(c.id) || {
        ordersCount: 0,
        netRevenue: 0,
        discountGranted: 0,
      },
    }));

    return NextResponse.json({ success: true, campaigns: enriched, serverTimeMs: now.getTime() });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminSessionWithDevice(req);
    if (!auth.authorized || !auth.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: auth.adminId },
      select: { email: true, name: true },
    });
    const adminActor = admin?.email || admin?.name || 'Admin';

    const body = await req.json();

    // Support duplicating an existing campaign into a safe DRAFT copy
    if (body.action === 'DUPLICATE' && body.id) {
      const source = await prisma.campaign.findUnique({ where: { id: body.id } });
      if (!source) {
        return NextResponse.json({ error: 'Original campaign not found.' }, { status: 404 });
      }

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const duplicateSlug = sanitizeCampaignSlug(`${source.slug}-copy-${randomSuffix}`);

      const duplicated = await prisma.campaign.create({
        data: {
          name: `${source.name} (Copy)`,
          slug: duplicateSlug,
          internalDescription: source.internalDescription,
          publicTitle: source.publicTitle,
          badgeText: source.badgeText,
          status: 'DRAFT', // Never auto-activate duplicated campaigns
          startDate: source.startDate,
          endDate: source.endDate,
          timezone: source.timezone,
          priority: source.priority,
          scopeType: source.scopeType,
          includedProductIds: source.includedProductIds,
          excludedProductIds: source.excludedProductIds,
          includedCollectionIds: source.includedCollectionIds,
          includedCategoryIds: source.includedCategoryIds,
          allowPreOrderProducts: source.allowPreOrderProducts,
          couponStackingMode: source.couponStackingMode,
          discountType: source.discountType,
          discountValue: source.discountValue,
          maxDiscountAmount: source.maxDiscountAmount,
          bannerTitle: source.bannerTitle,
          bannerSubtitle: source.bannerSubtitle,
          desktopBannerUrl: source.desktopBannerUrl,
          mobileBannerUrl: source.mobileBannerUrl,
          showBanner: source.showBanner,
          replaceHeroSlider: false,
          announcementEnabled: source.announcementEnabled,
          announcementText: source.announcementText,
          ctaText: source.ctaText,
          ctaLink: `/sale/${duplicateSlug}`,
          showCountdown: source.showCountdown,
          landingPageEnabled: source.landingPageEnabled,
          landingPageDescription: source.landingPageDescription,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          previewToken: generatePreviewToken(),
          createdBy: adminActor,
          updatedBy: adminActor,
        },
      });

      await recordAuditLog(
        'CAMPAIGN_DUPLICATED',
        'Campaign',
        duplicated.id,
        `Duplicated campaign "${source.name}" -> "${duplicated.name}" (slug: ${duplicated.slug}, status: DRAFT) by ${adminActor}`
      );

      revalidateCampaignCaches([duplicated.slug]);
      return NextResponse.json({
        success: true,
        campaign: enrichCampaignForAdmin(duplicated, new Date()),
      });
    }

    const validation = validateCampaignPayload(body, false);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Ensure unique slug
    const existingSlug = await prisma.campaign.findUnique({ where: { slug: data.slug! } });
    if (existingSlug) {
      return NextResponse.json(
        { error: `A campaign with URL slug "${data.slug}" already exists.` },
        { status: 400 }
      );
    }

    // Check if an overlapping active/scheduled campaign shares identical priority + overlapping dates
    const warnings: string[] = [];
    if (data.status === 'ACTIVE' || data.status === 'SCHEDULED') {
      const siblingCampaigns = await prisma.campaign.findMany({
        where: {
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          priority: data.priority ?? 10,
        },
      });

      for (const sib of siblingCampaigns) {
        const sStart = sib.startDate ? sib.startDate.getTime() : 0;
        const sEnd = sib.endDate ? sib.endDate.getTime() : Number.MAX_SAFE_INTEGER;
        const nStart = data.startDate ? data.startDate.getTime() : 0;
        const nEnd = data.endDate ? data.endDate.getTime() : Number.MAX_SAFE_INTEGER;
        if (nStart <= sEnd && sStart <= nEnd) {
          warnings.push(
            `Campaign "${sib.name}" overlaps in schedule and shares priority ${data.priority}. When products overlap, the larger customer discount will win automatically without stacking.`
          );
        }
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name!,
        slug: data.slug!,
        internalDescription: data.internalDescription ?? null,
        publicTitle: data.publicTitle!,
        badgeText: data.badgeText || 'SALE',
        status: data.status || 'DRAFT',
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        timezone: data.timezone || 'Asia/Karachi',
        priority: data.priority ?? 10,
        scopeType: data.scopeType || 'SELECTED_PRODUCTS',
        includedProductIds: data.includedProductIds || [],
        excludedProductIds: data.excludedProductIds || [],
        includedCollectionIds: data.includedCollectionIds || [],
        includedCategoryIds: data.includedCategoryIds || [],
        allowPreOrderProducts: Boolean(data.allowPreOrderProducts),
        couponStackingMode: data.couponStackingMode || 'BLOCK_COUPONS',
        discountType: data.discountType || 'PERCENTAGE',
        discountValue: data.discountValue ?? 0,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        bannerTitle: data.bannerTitle ?? null,
        bannerSubtitle: data.bannerSubtitle ?? null,
        desktopBannerUrl: data.desktopBannerUrl ?? null,
        mobileBannerUrl: data.mobileBannerUrl ?? null,
        showBanner: data.showBanner !== undefined ? data.showBanner : true,
        replaceHeroSlider: Boolean(data.replaceHeroSlider),
        announcementEnabled: Boolean(data.announcementEnabled),
        announcementText: data.announcementText ?? null,
        ctaText: data.ctaText || 'Shop Sale',
        ctaLink: data.ctaLink || `/sale/${data.slug}`,
        showCountdown: data.showCountdown !== undefined ? data.showCountdown : true,
        landingPageEnabled: data.landingPageEnabled !== undefined ? data.landingPageEnabled : true,
        landingPageDescription: data.landingPageDescription ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        previewToken: generatePreviewToken(),
        createdBy: adminActor,
        updatedBy: adminActor,
      },
    });

    await recordAuditLog(
      'CAMPAIGN_CREATED',
      'Campaign',
      campaign.id,
      `Created campaign "${campaign.name}" (/sale/${campaign.slug}) | Status: ${campaign.status} | Discount: ${campaign.discountType} ${campaign.discountValue} | Scope: ${campaign.scopeType} | Priority: ${campaign.priority} | By: ${adminActor}`
    );

    revalidateCampaignCaches([campaign.slug]);

    return NextResponse.json({
      success: true,
      campaign: enrichCampaignForAdmin(campaign, new Date()),
      warnings,
    });
  } catch (error: any) {
    console.error('Campaign creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

