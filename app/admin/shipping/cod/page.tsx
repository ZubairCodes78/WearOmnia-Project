import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CodSettlementClient } from './CodSettlementClient';

export const metadata: Metadata = {
  title: 'COD Settlement Reconciliation | WearOMNIA Enterprise Admin',
  description: 'Reconcile Cash On Delivery remittance, PostEx CPR numbers, and payments',
};

export const dynamic = 'force-dynamic';

export default async function CodSettlementPage() {
  const shipments = await prisma.shipment.findMany({
    where: { provider: 'POSTEX' },
    orderBy: { createdAt: 'desc' },
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

  const sanitized = shipments.map((s) => ({
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
      <CodSettlementClient initialShipments={sanitized as any} />
    </div>
  );
}
