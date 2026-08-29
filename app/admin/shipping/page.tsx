import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ShippingClient } from './ShippingClient';
import { getSiteSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Logistics & Shipping Control Tower | WearOMNIA Enterprise Admin',
  description: 'Enterprise Courier Hub, Live Parcel Tracking, Official AWB Generation, and COD Reconciliation',
};

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
        shipments: {
          none: {
            status: {
              notIn: ['FAILED', 'CANCELLED', 'ARCHIVED', 'Un-Assigned By Me', 'Expired'],
            },
          },
        },
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

  const sanitizedShipments = shipments.map((s) => ({
    ...s,
    settlementDate: s.settlementDate?.toISOString() || null,
    pickupDate: s.pickupDate?.toISOString() || null,
    deliveryDate: s.deliveryDate?.toISOString() || null,
    returnDate: s.returnDate?.toISOString() || null,
    upfrontPaymentDate: s.upfrontPaymentDate?.toISOString() || null,
    reservePaymentDate: s.reservePaymentDate?.toISOString() || null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const sanitizedOrders = confirmedOrders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <ShippingClient
      initialShipments={sanitizedShipments as any}
      siteSettings={siteSettings}
      confirmedOrders={sanitizedOrders as any}
    />
  );
}
