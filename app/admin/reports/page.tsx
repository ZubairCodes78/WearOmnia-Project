import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ReportsClient } from './ReportsClient';

export const metadata: Metadata = {
  title: 'Executive Analytics & Reports | WearOMNIA Enterprise Admin',
  description: 'Enterprise commercial analytics: Revenue, Profitability, Inventory Valuation, and Courier SLAs',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [orders, products, shipments] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    prisma.product.findMany({
      include: { variants: true },
    }),
    prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Aggregate Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0);
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const returnedOrders = orders.filter((o) => o.status === 'RETURNED');
  const totalOrders = orders.length;

  const totalStockUnits = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0) + (p.variants.length === 0 ? p.stockQuantity : 0),
    0
  );

  const stockValuation = products.reduce(
    (sum, p) => sum + (p.basePrice * (p.variants.reduce((vSum, v) => vSum + v.stock, 0) || p.stockQuantity)),
    0
  );

  const sanitizedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    shippingCity: o.shippingCity,
    totalAmount: o.totalAmount,
    status: o.status,
    courier: o.courier,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="border-b border-[#D4AF37]/15 pb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-[#D4AF37]">
            Executive Intelligence
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#FAF8F5]">
          Commercial Analytics & Logistics Reports
        </h1>
        <p className="text-xs text-[#FAF8F5]/60 mt-1 max-w-2xl">
          Real-time enterprise metrics across sales performance, inventory valuation, delivery fulfillment rate, and courier settlement reconciliation.
        </p>
      </div>

      <ReportsClient
        metrics={{
          totalRevenue,
          deliveredRevenue,
          totalOrders,
          deliveredOrdersCount: deliveredOrders.length,
          returnedOrdersCount: returnedOrders.length,
          totalStockUnits,
          stockValuation,
          postexShipmentsCount: shipments.filter((s) => s.provider === 'POSTEX').length,
        }}
        orders={sanitizedOrders}
      />
    </div>
  );
}
