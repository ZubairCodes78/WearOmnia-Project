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
    <div className="space-y-8">
      <div className="border-b border-[#D4AF37]/15 pb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-[#D4AF37]">
            Reverse Logistics & Shipper Advice
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#FAF8F5]">
          Returns & RTO Management
        </h1>
        <p className="text-xs text-[#FAF8F5]/60 mt-1 max-w-2xl">
          Track non-delivered parcels, failed delivery attempts, and submit Shipper Advice directly to PostEx courier network.
        </p>
      </div>

      <ReturnsClient initialShipments={sanitized as any} />
    </div>
  );
}
