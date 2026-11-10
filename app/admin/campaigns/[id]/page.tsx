import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getEffectiveCampaignPhase } from '@/lib/campaigns';
import { getCampaignAnalytics } from '@/lib/campaign-analytics';
import { formatKarachiDateTime } from '@/lib/coupons';
import { CampaignAnalyticsClient } from './CampaignAnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });

  if (!campaign) {
    notFound();
  }

  const analytics = await getCampaignAnalytics(campaign.id);
  const phase = getEffectiveCampaignPhase(campaign, new Date());

  return (
    <CampaignAnalyticsClient
      campaign={{
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        publicTitle: campaign.publicTitle,
        status: campaign.status,
        effectiveStatus: phase.effectiveStatus,
        statusLabel: phase.label,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
        formattedStartDate: formatKarachiDateTime(campaign.startDate),
        formattedEndDate: formatKarachiDateTime(campaign.endDate),
        timezone: campaign.timezone,
        previewToken: campaign.previewToken,
      }}
      analytics={analytics}
    />
  );
}

