import React from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get(COOKIE_NAME)?.value;

  const [settings, shippingRules, admin] = await Promise.all([
    getSiteSettings(),
    prisma.shippingRule.findMany({
      orderBy: { city: 'asc' },
    }),
    adminId
      ? prisma.admin.findUnique({
          where: { id: adminId },
          select: {
            id: true,
            email: true,
            name: true,
            twoFactorEnabled: true,
            twoFactorEnabledAt: true,
          },
        })
      : null,
  ]);

  return (
    <SettingsClient
      initialSettings={settings}
      initialShippingRules={shippingRules}
      initialAdmin={
        admin
          ? {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              twoFactorEnabled: admin.twoFactorEnabled,
              twoFactorEnabledAt: admin.twoFactorEnabledAt ? admin.twoFactorEnabledAt.toISOString() : null,
            }
          : null
      }
    />
  );
}
