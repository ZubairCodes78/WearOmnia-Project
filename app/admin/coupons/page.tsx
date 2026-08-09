import React from 'react';
import { prisma } from '@/lib/prisma';
import { CouponsClient } from './CouponsClient';

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return <CouponsClient initialCoupons={coupons} />;
}
