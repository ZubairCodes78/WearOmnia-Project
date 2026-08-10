import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrderDetailClient } from './OrderDetailClient';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: { take: 1, orderBy: { displayOrder: 'asc' } },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          whatsapp: true,
          email: true,
          ordersCount: true,
          totalSpent: true,
          isVIP: true,
        },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
      shipments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={JSON.parse(JSON.stringify(order))} />;
}
