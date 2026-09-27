import React from 'react';
import { prisma } from '@/lib/prisma';
import { CouponsClient } from './CouponsClient';
import { getCouponScheduleStatus } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const serializedCoupons = coupons.map((c) => {
    const schedule = getCouponScheduleStatus(c, now);
    return {
      ...c,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      scheduleStatus: schedule.status,
      statusLabel: schedule.label,
      durationDisplay: schedule.durationDisplay,
      formattedStartDate: schedule.startDateFormatted,
      formattedEndDate: schedule.endDateFormatted,
    };
  });

  return <CouponsClient initialCoupons={serializedCoupons as any} />;
}

