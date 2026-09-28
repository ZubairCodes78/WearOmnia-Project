import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ReturnsClient } from './ReturnsClient';

export const metadata: Metadata = {
  title: 'Returns & RTO Operations | WearOMNIA Enterprise Admin',
  description: 'Manage return to origin parcels and shipper advice on PostEx logistics network',
};

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
  const returnShipments = await prisma.shipment.findMany({
    where: {
      OR: [
        { status: { in: ['RETURNED', 'Returned', 'Out For Return', 'Attempted', 'Delivery Under Review'] } },
        { returnDate: { not: null } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          shippingCity: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  const sanitized = returnShipments.map((s) => ({
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

  return (
    <div className="space-y-6">
      <ReturnsClient initialShipments={sanitized as any} />
    </div>
  );
}
