import React from 'react';
import { prisma } from '@/lib/prisma';
import { ShippingClient } from './ShippingClient';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const [shipments, siteSettings, confirmedOrders] = await Promise.all([
    prisma.shipment.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            shippingCity: true,
            shippingAddress: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    getSiteSettings(),
    prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        shipments: { none: { status: { notIn: ['FAILED', 'CANCELLED'] } } },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        shippingCity: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <ShippingClient
      initialShipments={shipments as any}
      siteSettings={siteSettings}
      confirmedOrders={confirmedOrders as any}
    />
  );
}
