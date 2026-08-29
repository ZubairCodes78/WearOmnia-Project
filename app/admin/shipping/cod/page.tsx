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
    <div className="space-y-8">
      <div className="border-b border-[#D4AF37]/15 pb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-[#D4AF37]">
            Financial Operations
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#FAF8F5]">
          PostEx COD Settlement Reconciliation
        </h1>
        <p className="text-xs text-[#FAF8F5]/60 mt-1 max-w-2xl">
          Live tracking of cash collected, upfront payments, CPR (Cheque Payment Reference) numbers, and bank disbursement status.
        </p>
      </div>

      <CodSettlementClient initialShipments={sanitized as any} />
    </div>
  );
}
