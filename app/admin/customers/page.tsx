import React from 'react';
import { prisma } from '@/lib/prisma';
import { CustomersClient } from './CustomersClient';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      },
    },
    orderBy: { totalSpent: 'desc' },
    take: 150,
  });

  return <CustomersClient initialCustomers={customers as any} />;
}
