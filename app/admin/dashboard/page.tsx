import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Banknote,
  Truck,
  ArrowUpRight,
  TrendingUp,
  Boxes,
  CreditCard,
  Users,
} from 'lucide-react';
import { OrderStatusBadge } from '../orders/OrderStatusBadge';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalOrders,
    todayAggregate,
    pendingOrders,
    confirmedOrders,
    dispatchedOrders,
    deliveredOrders,
    returnedOrders,
    recentOrders,
    lowStockProducts,
    outOfStockProducts,
    totalProducts,
    totalCustomers,
    salesAggregate,
    allProducts,
    unsettledAggregate,
    cityBreakdown,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfToday } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: { in: ['PACKING', 'DISPATCHED', 'OUT_FOR_DELIVERY'] } } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: { in: ['CANCELLED', 'RETURNED'] } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { items: true, shipments: { take: 1, orderBy: { createdAt: 'desc' } } },
    }),
    prisma.product.count({ where: { stockQuantity: { lte: 5, gt: 0 } } }),
    prisma.product.count({ where: { stockQuantity: { lte: 0 } } }),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    }),
    prisma.product.findMany({ select: { stockQuantity: true, basePrice: true } }),
    prisma.shipment.aggregate({
      where: {
        status: { in: ['DELIVERED', 'Delivered'] },
        OR: [{ settlementStatus: 'PENDING' }, { settlementStatus: null }, { settlementStatus: 'UNPAID' }],
      },
      _sum: { codAmount: true },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ['shippingCity'],
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 6,
    }),
  ]);

  const todayRevenue = todayAggregate._sum.totalAmount || 0;
  const todayOrdersCount = todayAggregate._count.id || 0;
  const totalRevenue = salesAggregate._sum.totalAmount || 0;
  const validOrdersCount = salesAggregate._count.id || 0;
  const averageOrderValue = Math.round(salesAggregate._avg.totalAmount || 0);
  const totalStockValuation = allProducts.reduce((sum, p) => sum + p.stockQuantity * p.basePrice, 0);
  const pendingSettlementValue = unsettledAggregate._sum.codAmount || 0;
  const unsettledCount = unsettledAggregate._count.id || 0;

  const citySalesList = cityBreakdown.map((item) => ({
    city: item.shippingCity?.trim() || 'Other',
    count: item._count.id,
    total: item._sum.totalAmount || 0,
  }));

  return (
    <div className="admin-page text-[#FAF8F5] space-y-8">
      {/* 1. Standardized SaaS Page Header */}
      <AdminPageHeader
        badge="WearOMNIA Atelier"
        title="Commerce & Operations"
        description="Real-time commercial performance, nationwide Cash On Delivery dispatch pipeline, and inventory status."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/shipping"
              className="bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-colors flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5" /> Shipping Hub
            </Link>
            <Link
              href="/admin/orders"
              className="bg-[#D4AF37] text-black hover:bg-[#FAF8F5] px-4 py-2.5 rounded-xl text-xs uppercase font-black tracking-wider transition-colors flex items-center gap-2 shadow-sm"
            >
              Orders Console <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* 2. Primary KPI / Overview Area */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37]">Commercial Highlights</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Today's Sales */}
          <div className="bg-[#0A2528] p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-[#D4AF37]/35 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]/90">Today&apos;s Sales</span>
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">Rs. {todayRevenue.toLocaleString()}</p>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/5">
              <span className="text-emerald-400 font-medium">{todayOrdersCount} orders placed today</span>
              <span className="text-[10px] text-[#FAF8F5]/40 font-mono">Today</span>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-[#0A2528] p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-[#D4AF37]/35 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]/90">Total Sales Volume</span>
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">Rs. {totalRevenue.toLocaleString()}</p>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/5">
              <span className="text-[#D4AF37] font-medium">Avg Order: Rs. {averageOrderValue.toLocaleString()}</span>
              <span className="text-[10px] text-[#FAF8F5]/40 font-mono">{validOrdersCount} orders</span>
            </div>
          </div>

          {/* Stock Valuation */}
          <div className="bg-[#0A2528] p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-[#D4AF37]/35 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]/90">Stock Valuation</span>
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">Rs. {totalStockValuation.toLocaleString()}</p>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/5">
              <span className="text-emerald-400 font-medium">{totalProducts} active products</span>
              <Link href="/admin/inventory" className="text-[#D4AF37] hover:underline text-[10px] font-bold">
                Manage →
              </Link>
            </div>
          </div>

          {/* Pending COD Settlement */}
          <div className="bg-[#0A2528] p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-amber-400/35 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90">Pending Courier Settlement</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">Rs. {pendingSettlementValue.toLocaleString()}</p>
            <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/5">
              <span className="text-amber-200/80 font-medium">{unsettledCount} parcels pending payment</span>
              <Link href="/admin/shipping/cod" className="text-amber-300 hover:underline text-[10px] font-bold">
                Reconcile →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Important Operational Information (Fulfillment Pipeline) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37]">Fulfillment &amp; Pipeline Status</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <Link
            href="/admin/orders?status=PENDING"
            className="bg-[#0A2528] hover:bg-[#0D3337] p-4 sm:p-5 rounded-xl border border-white/10 hover:border-amber-400/40 transition-colors block group"
          >
            <span className="text-[10px] uppercase font-bold text-amber-400/90 block tracking-wider">Pending</span>
            <span className="font-serif text-2xl font-bold text-amber-300 block mt-1.5">{pendingOrders}</span>
            <span className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5 block">Awaiting confirm</span>
          </Link>

          <Link
            href="/admin/orders?status=CONFIRMED"
            className="bg-[#0A2528] hover:bg-[#0D3337] p-4 sm:p-5 rounded-xl border border-white/10 hover:border-blue-400/40 transition-colors block group"
          >
            <span className="text-[10px] uppercase font-bold text-blue-400/90 block tracking-wider">Confirmed</span>
            <span className="font-serif text-2xl font-bold text-blue-300 block mt-1.5">{confirmedOrders}</span>
            <span className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5 block">Ready to pack</span>
          </Link>

          <Link
            href="/admin/shipping?tab=IN_TRANSIT"
            className="bg-[#0A2528] hover:bg-[#0D3337] p-4 sm:p-5 rounded-xl border border-white/10 hover:border-cyan-400/40 transition-colors block group"
          >
            <span className="text-[10px] uppercase font-bold text-cyan-400/90 block tracking-wider">With Courier</span>
            <span className="font-serif text-2xl font-bold text-cyan-300 block mt-1.5">{dispatchedOrders}</span>
            <span className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5 block">In transit</span>
          </Link>

          <Link
            href="/admin/orders?status=DELIVERED"
            className="bg-[#0A2528] hover:bg-[#0D3337] p-4 sm:p-5 rounded-xl border border-white/10 hover:border-emerald-400/40 transition-colors block group"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-400/90 block tracking-wider">Delivered</span>
            <span className="font-serif text-2xl font-bold text-emerald-300 block mt-1.5">{deliveredOrders}</span>
            <span className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5 block">Completed</span>
          </Link>

          <Link
            href="/admin/shipping/returns"
            className="bg-[#0A2528] hover:bg-[#0D3337] p-4 sm:p-5 rounded-xl border border-white/10 hover:border-rose-400/40 transition-colors block group"
          >
            <span className="text-[10px] uppercase font-bold text-rose-400/90 block tracking-wider">Returns / RTO</span>
            <span className="font-serif text-2xl font-bold text-rose-300 block mt-1.5">{returnedOrders}</span>
            <span className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5 block">Action needed</span>
          </Link>

          <Link
            href="/admin/inventory?filter=LOW_STOCK"
            className="bg-[#0A2528] hover:bg-[#0D3337] p-4 sm:p-5 rounded-xl border border-white/10 hover:border-amber-400/40 transition-colors block group"
          >
            <span className="text-[10px] uppercase font-bold text-amber-400/90 block tracking-wider">Low / Out Stock</span>
            <span className="font-serif text-2xl font-bold text-amber-300 block mt-1.5">
              {lowStockProducts + outOfStockProducts}
            </span>
            <span className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5 block">{outOfStockProducts} sold out</span>
          </Link>
        </div>
      </div>

      {/* 4. Orders / Sales Activity & Regional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Recent Orders Table */}
        <div className="lg:col-span-8 bg-[#0A2528] rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Activity Feed</p>
                <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Recent Customer Orders</h2>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs uppercase font-semibold tracking-wider text-[#D4AF37] hover:text-white transition-colors"
              >
                View All Orders →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 text-left">Order</th>
                    <th className="py-3 px-4 text-left">Customer &amp; City</th>
                    <th className="py-3 px-4 text-left">Items</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#FAF8F5]/50">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#103A3E]/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#D4AF37]">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#FAF8F5] block">{order.customerName}</span>
                          <span className="text-[11px] text-[#FAF8F5]/50">{order.shippingCity}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#FAF8F5]/70">
                          {order.items.length} item(s)
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#FAF8F5]">
                          Rs. {order.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="px-2.5 py-1 bg-[#103A3E] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-lg text-[10px] font-bold uppercase transition-all inline-block"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Regional City Distribution & Operational Highlights */}
        <div className="lg:col-span-4 bg-[#0A2528] rounded-2xl border border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Delivery Reach</p>
            <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Top Destinations by Sales</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5 font-sans">Nationwide dispatch distribution</p>

            <div className="space-y-4 mt-5">
              {citySalesList.length === 0 ? (
                <p className="text-xs text-[#FAF8F5]/50 py-4 text-center">No delivery data recorded yet.</p>
              ) : (
                citySalesList.slice(0, 6).map((item, idx) => {
                  const percentage = totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 100) : 0;
                  return (
                    <div key={item.city} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-[#103A3E] text-[#D4AF37] font-mono text-[10px] font-bold flex items-center justify-center border border-[#D4AF37]/20">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-[#FAF8F5]">{item.city}</span>
                        </div>
                        <span className="font-mono text-[#FAF8F5]/90 font-medium">
                          Rs. {item.total.toLocaleString()} <span className="text-[10px] text-[#FAF8F5]/50">({item.count})</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#06191B] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#FAF8F5]/70 font-sans flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" /> Registered Customers:
            </span>
            <span className="font-bold font-mono text-[#D4AF37] text-sm bg-teal-950/60 px-2.5 py-0.5 rounded-lg border border-[#D4AF37]/20">
              {totalCustomers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
