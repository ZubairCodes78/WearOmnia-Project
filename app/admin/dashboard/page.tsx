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
    shipmentsPendingSettlement,
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
        status: { in: ['DELIVERED', 'Booked', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        OR: [{ settlementStatus: 'PENDING' }, { settlementStatus: null }, { settlementStatus: 'UNPAID' }],
      },
      select: { codAmount: true },
    }),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalStockValuation = allProducts.reduce((sum, p) => sum + p.stockQuantity * p.basePrice, 0);
  const pendingSettlementValue = shipmentsPendingSettlement.reduce((sum, s) => sum + s.codAmount, 0);

  // City Breakdown calculation
  const citySalesMap: Record<string, { count: number; total: number }> = {};
  allOrders.forEach((o) => {
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
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Enterprise Command Center
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE SYSTEM
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#FAF8F5] mt-2">
            WearOMNIA Operations Hub
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Real-time sales performance, nationwide COD dispatch pipeline, and inventory intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/shipping"
            className="bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40 px-5 py-3 rounded-xl text-xs uppercase font-bold tracking-widest transition-all flex items-center gap-2 shadow-lg"
          >
            <Truck className="w-4 h-4" /> PostEx Shipping Hub
          </Link>
          <Link
            href="/admin/orders"
            className="bg-[#D4AF37] text-black hover:bg-white px-6 py-3 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-xl shadow-[#D4AF37]/15 flex items-center gap-2"
          >
            Orders Console <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Performance */}
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Today&apos;s Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-[#FAF8F5]">Rs. {todayRevenue.toLocaleString()}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-400 font-semibold">{todayOrdersCount} orders placed today</span>
            <span className="text-xs text-[#D4AF37]/80 font-mono font-bold">24h</span>
          </div>
        </div>

        {/* Total Lifetime COD Revenue */}
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Total COD Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-[#FAF8F5]">Rs. {totalRevenue.toLocaleString()}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-[#FAF8F5]/70 font-semibold">{totalOrders} Nationwide Orders</span>
            <span className="text-emerald-400 font-mono font-bold">AOV: Rs. {averageOrderValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Pending Confirmation */}
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pending Confirmation</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-amber-400">{pendingOrders}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-amber-300 font-semibold">Requires phone confirmation</span>
            <Link href="/admin/orders?status=PENDING" className="text-amber-400 underline font-bold hover:text-white">
              Review →
            </Link>
          </div>
        </div>

        {/* Confirmed Ready for PostEx */}
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Ready for PostEx</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-emerald-400">{confirmedOrders}</p>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-300 font-semibold">Ready for 1-Click Booking</span>
            <Link href="/admin/orders?status=CONFIRMED" className="text-emerald-400 underline font-bold hover:text-white">
              Dispatch →
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Operational Pipeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0A2528]/60 p-4 rounded-xl border border-[#D4AF37]/15">
          <span className="text-[10px] uppercase font-bold text-[#D4AF37]/80 block">In Transit / Dispatch</span>
          <p className="font-serif text-xl font-bold text-[#FAF8F5] mt-1">{dispatchedOrders}</p>
          <span className="text-[10px] text-[#FAF8F5]/60 block mt-0.5">With Courier</span>
        </div>

        <div className="bg-[#0A2528]/60 p-4 rounded-xl border border-[#D4AF37]/15">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Delivered Orders</span>
          <p className="font-serif text-xl font-bold text-emerald-400 mt-1">{deliveredOrders}</p>
          <span className="text-[10px] text-emerald-300/80 block mt-0.5">Successful Deliveries</span>
        </div>

        <div className="bg-[#0A2528]/60 p-4 rounded-xl border border-[#D4AF37]/15">
          <span className="text-[10px] uppercase font-bold text-red-400 block">Returned / RTO</span>
          <p className="font-serif text-xl font-bold text-red-400 mt-1">{returnedOrders}</p>
          <span className="text-[10px] text-red-300/80 block mt-0.5">Cancelled / Returns</span>
        </div>

        <div className="bg-[#0A2528]/60 p-4 rounded-xl border border-[#D4AF37]/15">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">COD Settlement Due</span>
          <p className="font-serif text-lg font-bold text-amber-300 mt-1 truncate">Rs. {pendingSettlementValue.toLocaleString()}</p>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Pending Payouts</span>
        </div>

        <div className="bg-[#0A2528]/60 p-4 rounded-xl border border-[#D4AF37]/15">
          <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">Stock Valuation</span>
          <p className="font-serif text-lg font-bold text-[#D4AF37] mt-1 truncate">Rs. {totalStockValuation.toLocaleString()}</p>
          <span className="text-[10px] text-[#FAF8F5]/60 block mt-0.5">{totalProducts} Luxury SKUs</span>
        </div>

        <div className="bg-[#0A2528]/60 p-4 rounded-xl border border-red-500/30">
          <span className="text-[10px] uppercase font-bold text-red-400 block">Low / Out of Stock</span>
          <p className="font-serif text-xl font-bold text-red-400 mt-1">{lowStockProducts + outOfStockProducts}</p>
          <Link href="/admin/inventory" className="text-[10px] text-red-400 underline font-semibold block mt-0.5">
            Inventory Alert →
          </Link>
        </div>
      </div>

      {/* Regional Sales Breakdown & Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pakistan Regional Distribution */}
        <div className="lg:col-span-6 bg-[#0A2528]/75 backdrop-blur-2xl p-6 rounded-3xl border border-[#D4AF37]/20 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
            <h3 className="font-serif text-xl font-bold text-[#D4AF37] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D4AF37]" /> Nationwide Sales Distribution
            </h3>
            <span className="text-xs text-[#FAF8F5]/60 font-semibold">{citySalesList.length} Cities Covered</span>
          </div>

          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {citySalesList.length === 0 ? (
              <p className="text-xs text-[#FAF8F5]/50 italic py-4">No order destination data available yet.</p>
            ) : (
              citySalesList.map((item) => {
                const percentage = totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 100) : 0;
                return (
                  <div key={item.city} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#FAF8F5]">
                      <span>{item.city} ({item.count} Orders)</span>
                      <span className="text-[#D4AF37] font-mono font-bold">Rs. {item.total.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#06191B] h-2 rounded-full overflow-hidden border border-[#D4AF37]/10">
                      <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Operational Overview Quick Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-[#D4AF37]/20 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-bold text-[#FAF8F5]">{totalCustomers}</h4>
                <p className="text-xs text-[#FAF8F5]/70">Verified Customer Profiles Linked by Mobile</p>
              </div>
            </div>
            <Link href="/admin/customers" className="text-xs font-bold text-[#D4AF37] hover:underline uppercase">
              View Clientele →
            </Link>
          </div>

          <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-[#D4AF37]/20 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-bold text-[#FAF8F5]">{totalProducts}</h4>
                <p className="text-xs text-[#FAF8F5]/70">Active Luxury Catalog SKUs</p>
              </div>
            </div>
            <Link href="/admin/products" className="text-xs font-bold text-[#D4AF37] hover:underline uppercase">
              Manage Products →
            </Link>
          </div>

          <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-[#D4AF37]/20 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-bold text-[#FAF8F5]">{confirmedOrders} Ready</h4>
                <p className="text-xs text-[#FAF8F5]/70">Orders Awaiting Courier Dispatch</p>
              </div>
            </div>
            <Link href="/admin/shipping" className="text-xs font-bold text-[#D4AF37] hover:underline uppercase">
              Open Courier Hub →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Live Stream Table */}
      <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#D4AF37]/15 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#D4AF37]">Recent Orders Pipeline</h3>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">Real-time nationwide order stream and PostEx dispatch status.</p>
          </div>
          <Link href="/admin/orders" className="text-xs uppercase font-bold text-[#D4AF37] hover:underline">
            View All Orders ({totalOrders}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">City</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Courier / Tracking</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#FAF8F5]/50 italic">
                    No orders recorded yet. Customer checkout orders will appear here automatically.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const activeShipment = order.shipments?.[0];
                  const tracking = activeShipment?.trackingNumber || order.trackingNumber;
                  return (
                    <tr key={order.id} className="hover:bg-[#103A3E]/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#D4AF37]">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#FAF8F5] block">{order.customerName}</span>
                        <span className="text-[11px] font-mono text-[#FAF8F5]/60">{order.customerPhone}</span>
                      </td>
                      <td className="p-4 text-[#FAF8F5]/80">{order.shippingCity}</td>
                      <td className="p-4 font-mono font-bold text-[#FAF8F5]">Rs. {order.totalAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="p-4">
                        {tracking ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-[#D4AF37] border border-[#D4AF37]/30 block w-fit font-mono">
                              {order.courier || 'PostEx'}: {tracking}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#FAF8F5]/50 italic">Not Shipped</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border border-[#D4AF37]/30 inline-block"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
