import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const [settings, shippingRules] = await Promise.all([
    getSiteSettings(),
    prisma.shippingRule.findMany({
      orderBy: { city: 'asc' },
    }),
  ]);

  return <SettingsClient initialSettings={settings} initialShippingRules={shippingRules} />;
}
