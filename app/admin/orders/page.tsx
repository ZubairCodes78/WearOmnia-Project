import React from 'react';
import { prisma } from '@/lib/prisma';
import { OrdersClient } from './OrdersClient';

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { orderNumber: { contains: params.search } },
              { customerName: { contains: params.search } },
              { customerPhone: { contains: params.search } },
              { shippingCity: { contains: params.search } },
            ],
          }
        : {}),
    },
    include: {
      items: true,
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <OrdersClient initialOrders={orders} initialSearch={params.search || ''} initialStatus={params.status || ''} />;
}
