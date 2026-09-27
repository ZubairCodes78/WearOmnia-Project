import React from 'react';
import { prisma } from '@/lib/prisma';
import { LabelsClient } from './LabelsClient';

export const dynamic = 'force-dynamic';

export default async function AdminShippingLabelsPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
    include: {
      shipments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const serialized = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    shippingCity: o.shippingCity,
    totalAmount: o.totalAmount,
    codCharges: o.codCharges,
    status: o.status,
    trackingNumber: o.trackingNumber,
    courier: o.courier,
    isPreOrder: o.isPreOrder,
    preOrderRemainingAmount: o.preOrderRemainingAmount,
    createdAt: o.createdAt.toISOString(),
    shipments: o.shipments.map((s) => ({
      id: s.id,
      trackingNumber: s.trackingNumber,
      status: s.status,
      codAmount: s.codAmount,
    })),
  }));

  return <LabelsClient initialOrders={serialized} />;
}
