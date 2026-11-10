import React from 'react';
import { prisma } from '@/lib/prisma';
import { CampaignsClient } from './CampaignsClient';
import { getEffectiveCampaignPhase } from '@/lib/campaigns';
import { formatKarachiDateTime, calculateDurationDisplay } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  const [campaigns, products, categories, collections, ordersWithCampaigns] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.product.findMany({
      select: {
        id: true,
        title: true,
        sku: true,
        basePrice: true,
        discountPrice: true,
        isPreOrder: true,
        status: true,
        categoryId: true,
        collectionId: true,
      },
      orderBy: { title: 'asc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.collection.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.order.findMany({
      where: {
        OR: [{ campaignId: { not: null } }, { campaignIds: { isEmpty: false } }],
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

  const summaryMap = new Map<
    string,
    { ordersCount: number; netRevenue: number; discountGranted: number }
  >();
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
  const serializedCampaigns = campaigns.map((c) => {
    const phase = getEffectiveCampaignPhase(c, now);
    return {
      ...c,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      effectiveStatus: phase.effectiveStatus,
      isLive: phase.isLive,
      statusLabel: phase.label,
      durationDisplay: calculateDurationDisplay(c.startDate, c.endDate),
      formattedStartDate: formatKarachiDateTime(c.startDate),
      formattedEndDate: formatKarachiDateTime(c.endDate),
      analyticsSummary: summaryMap.get(c.id) || {
        ordersCount: 0,
        netRevenue: 0,
        discountGranted: 0,
      },
    };
  });

  return (
    <CampaignsClient
      initialCampaigns={serializedCampaigns}
      products={products}
      categories={categories}
      collections={collections}
    />
  );
}

