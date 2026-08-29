import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Banknote,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Users,
  Package,
  ArrowUpRight,
  MapPin,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Boxes,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { OrderStatusBadge } from '../orders/OrderStatusBadge';
import { isValidActiveShipment } from '@/lib/courier/canonical-status';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalOrders,
    todayOrdersCount,
    todayOrders,
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
    allOrders,
    allProducts,
    deliveredUnsettledShipments,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { totalAmount: true },
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
    prisma.order.findMany({ select: { totalAmount: true, shippingCity: true, status: true } }),
    prisma.product.findMany({ select: { stockQuantity: true, basePrice: true } }),
    prisma.shipment.findMany({
      where: {
        status: { in: ['DELIVERED', 'Delivered'] },
        OR: [{ settlementStatus: 'PENDING' }, { settlementStatus: null }, { settlementStatus: 'UNPAID' }],
      },
      select: { codAmount: true },
    }),
  ]);

  const validOrders = allOrders.filter((o) => o.status !== 'CANCELLED');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const totalStockValuation = allProducts.reduce((sum, p) => sum + p.stockQuantity * p.basePrice, 0);
  const pendingSettlementValue = deliveredUnsettledShipments.reduce((sum, s) => sum + s.codAmount, 0);

  // City Breakdown calculation
  const citySalesMap: Record<string, { count: number; total: number }> = {};
  validOrders.forEach((o) => {
    const city = o.shippingCity?.trim() || 'Other';
    if (!citySalesMap[city]) citySalesMap[city] = { count: 0, total: 0 };
    citySalesMap[city].count += 1;
    citySalesMap[city].total += o.totalAmount;
  });

  const citySalesList = Object.entries(citySalesMap)
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Luxury Dark Glass Banner */}
      <div className="bg-[#0A2528] p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] bg-teal-950/80 px-3 py-0.5 rounded-md border border-[#D4AF37]/30">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Enterprise Command Center
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE OPERATIONS
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
            WearOMNIA Operations Hub
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Real-time commercial performance, nationwide COD dispatch pipeline, and inventory intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/shipping"
            className="bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-2 shadow"
          >
            <Truck className="w-4 h-4" /> Shipping Hub
          </Link>
          <Link
            href="/admin/orders"
            className="bg-[#D4AF37] text-black hover:bg-white px-5 py-2.5 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all shadow-lg flex items-center gap-1.5"
          >
            Orders Console <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Performance */}
        <div className="bg-[#0A2528] p-5 rounded-2xl border border-[#D4AF37]/20 shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Today&apos;s Sales</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5]">Rs. {todayRevenue.toLocaleString()}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-400 font-semibold">{todayOrdersCount} orders placed</span>
            <span className="text-[10px] text-[#FAF8F5]/50 font-mono">Today</span>
          </div>
        </div>

        {/* Total Recognized Revenue */}
        <div className="bg-[#0A2528] p-5 rounded-2xl border border-[#D4AF37]/20 shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5]">Rs. {totalRevenue.toLocaleString()}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-[#D4AF37] font-semibold">AOV: Rs. {averageOrderValue.toLocaleString()}</span>
            <span className="text-[10px] text-[#FAF8F5]/50 font-mono">{validOrders.length} valid orders</span>
          </div>
        </div>

        {/* Inventory Stock Valuation */}
        <div className="bg-[#0A2528] p-5 rounded-2xl border border-[#D4AF37]/20 shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Stock Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5]">Rs. {totalStockValuation.toLocaleString()}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-400 font-semibold">{totalProducts} active catalog SKUs</span>
            <Link href="/admin/inventory" className="text-[#D4AF37] hover:underline text-[10px] font-bold">
              Manage →
            </Link>
          </div>
        </div>

        {/* Courier COD Pending Settlement */}
        <div className="bg-[#0A2528] p-5 rounded-2xl border border-amber-500/30 shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Delivered Pending CPR</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-amber-400">Rs. {pendingSettlementValue.toLocaleString()}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-amber-300 font-semibold">{deliveredUnsettledShipments.length} parcels awaiting transfer</span>
            <Link href="/admin/shipping/cod" className="text-amber-400 hover:underline text-[10px] font-bold">
              Reconcile →
            </Link>
          </div>
        </div>
      </div>

      {/* Operations Pipeline Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/admin/orders?status=PENDING"
          className="bg-[#0A2528] hover:bg-[#103A3E]/60 p-4 rounded-xl border border-amber-500/30 transition-all block"
        >
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Pending Orders</span>
          <span className="font-serif text-2xl font-bold text-amber-400 block mt-1">{pendingOrders}</span>
          <span className="text-[10px] text-[#FAF8F5]/50">Awaiting confirmation</span>
        </Link>

        <Link
          href="/admin/orders?status=CONFIRMED"
          className="bg-[#0A2528] hover:bg-[#103A3E]/60 p-4 rounded-xl border border-blue-500/30 transition-all block"
        >
          <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">Confirmed</span>
          <span className="font-serif text-2xl font-bold text-blue-400 block mt-1">{confirmedOrders}</span>
          <span className="text-[10px] text-[#FAF8F5]/50">Ready for packing</span>
        </Link>

        <Link
          href="/admin/shipping?tab=IN_TRANSIT"
          className="bg-[#0A2528] hover:bg-[#103A3E]/60 p-4 rounded-xl border border-cyan-500/30 transition-all block"
        >
          <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">In Courier Transit</span>
          <span className="font-serif text-2xl font-bold text-cyan-400 block mt-1">{dispatchedOrders}</span>
          <span className="text-[10px] text-[#FAF8F5]/50">With delivery network</span>
        </Link>

        <Link
          href="/admin/orders?status=DELIVERED"
          className="bg-[#0A2528] hover:bg-[#103A3E]/60 p-4 rounded-xl border border-emerald-500/30 transition-all block"
        >
          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Delivered</span>
          <span className="font-serif text-2xl font-bold text-emerald-400 block mt-1">{deliveredOrders}</span>
          <span className="text-[10px] text-[#FAF8F5]/50">Completed fulfillments</span>
        </Link>

        <Link
          href="/admin/shipping/returns"
          className="bg-[#0A2528] hover:bg-[#103A3E]/60 p-4 rounded-xl border border-rose-500/30 transition-all block"
        >
          <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">Returns / RTO</span>
          <span className="font-serif text-2xl font-bold text-rose-400 block mt-1">{returnedOrders}</span>
          <span className="text-[10px] text-[#FAF8F5]/50">Shipper advice required</span>
        </Link>

        <Link
          href="/admin/inventory?filter=LOW_STOCK"
          className="bg-[#0A2528] hover:bg-[#103A3E]/60 p-4 rounded-xl border border-amber-500/30 transition-all block"
        >
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Low / Out Stock</span>
          <span className="font-serif text-2xl font-bold text-amber-400 block mt-1">
            {lowStockProducts + outOfStockProducts}
          </span>
          <span className="text-[10px] text-[#FAF8F5]/50">{outOfStockProducts} zero stock</span>
        </Link>
      </div>

      {/* Main Content Split: Recent Orders Table & Regional Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 bg-[#0A2528] rounded-2xl border border-[#D4AF37]/15 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#D4AF37]/15 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#FAF8F5]">Recent Commercial Orders</h2>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">Live order feed with instant fulfillment status</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/15">
                <tr>
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Customer & City</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#FAF8F5]/50">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#103A3E]/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-[#FAF8F5] block">{order.customerName}</span>
                        <span className="text-[11px] text-[#FAF8F5]/60">{order.shippingCity}</span>
                      </td>
                      <td className="p-3.5 text-[#FAF8F5]/70">
                        {order.items.length} item(s)
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#FAF8F5]">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-2.5 py-1 bg-[#103A3E] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-lg text-[10px] font-bold uppercase transition-all"
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

        {/* Regional City Distribution */}
        <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/15 p-5 shadow-xl space-y-4">
          <div>
            <h2 className="font-serif text-base font-bold text-[#FAF8F5]">Regional Sales Breakdown</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">Top delivery destinations by revenue</p>
          </div>

          <div className="space-y-3">
            {citySalesList.length === 0 ? (
              <p className="text-xs text-[#FAF8F5]/50 py-4 text-center">No delivery data yet.</p>
            ) : (
              citySalesList.slice(0, 6).map((item, idx) => {
                const percentage = totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 100) : 0;
                return (
                  <div key={item.city} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#103A3E] text-[#D4AF37] font-mono text-[9px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[#FAF8F5]">{item.city}</span>
                      </div>
                      <span className="font-mono text-[#FAF8F5]/80 font-bold">
                        Rs. {item.total.toLocaleString()} ({item.count})
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

          <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between text-xs">
            <span className="text-[#FAF8F5]/60">Total Active Customers:</span>
            <span className="font-bold font-mono text-[#D4AF37]">{totalCustomers}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
