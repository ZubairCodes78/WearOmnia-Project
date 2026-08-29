import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { PostExCommandCenter } from './PostExCommandCenter';

export const metadata: Metadata = {
  title: 'PostEx Logistics Hub | WearOMNIA Enterprise Admin',
  description: 'Comprehensive PostEx Courier M-v4.1.9 operations and diagnostic control center',
};

export const dynamic = 'force-dynamic';

export default async function PostExHubPage() {
  const settings = await getSiteSettings();

  const [recentShipments, confirmedOrdersCount, pendingSettlementCount] = await Promise.all([
    prisma.shipment.findMany({
      where: { provider: 'POSTEX' },
      take: 20,
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
    }),
    prisma.order.count({
      where: { status: { in: ['CONFIRMED', 'PACKING'] }, courier: { not: 'POSTEX' } },
    }),
    prisma.shipment.count({
      where: {
        provider: 'POSTEX',
        OR: [{ settlementStatus: { in: ['PENDING', 'UNPAID'] } }, { settlementStatus: null }],
      },
    }),
  ]);

  const sanitizedShipments = recentShipments.map((s) => ({
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D4AF37]/15 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-[#D4AF37]">
              Official API Integration M-v4.1.9
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#FAF8F5]">
            PostEx Logistics Command Center
          </h1>
          <p className="text-xs text-[#FAF8F5]/60 mt-1 max-w-2xl">
            Live operations, merchant pickup addresses, operational delivery routing, batch AWB label printing, tracking status history, and COD settlement reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-xl px-4 py-2 text-right">
            <div className="text-[10px] uppercase font-bold text-[#D4AF37]/70 tracking-widest">Environment</div>
            <div className="text-xs font-bold text-[#FAF8F5] flex items-center gap-1.5 justify-end">
              <span className={`w-2 h-2 rounded-full ${settings.postex_environment === 'PRODUCTION' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {settings.postex_environment || 'TEST'}
            </div>
          </div>
        </div>
      </div>

      <PostExCommandCenter
        siteSettings={settings}
        initialShipments={sanitizedShipments as any}
        stats={{
          confirmedOrdersCount,
          pendingSettlementCount,
        }}
      />
    </div>
  );
}
