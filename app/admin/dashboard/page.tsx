import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Banknote, Clock, CheckCircle2, Truck, AlertTriangle, Users, Package, ArrowUpRight, MapPin, TrendingUp, Sparkles } from 'lucide-react';
import { OrderStatusBadge } from '../orders/OrderStatusBadge';

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    recentOrders,
    lowStockProducts,
    totalProducts,
    totalCustomers,
    allOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    prisma.product.count({ where: { stockQuantity: { lte: 5 } } }),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.order.findMany({ select: { totalAmount: true, shippingCity: true } }),
  ]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // City Breakdown calculation
  const citySalesMap: Record<string, { count: number; total: number }> = {};
  allOrders.forEach((o) => {
    const city = o.shippingCity || 'Other';
    if (!citySalesMap[city]) citySalesMap[city] = { count: 0, total: 0 };
    citySalesMap[city].count += 1;
    citySalesMap[city].total += o.totalAmount;
  });

  const citySalesList = Object.entries(citySalesMap)
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Dark Glass Top Banner */}
      <div className="bg-[#0A2528]/80 backdrop-blur-xl p-8 rounded-3xl border border-champagne/30 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] font-semibold text-champagne bg-teal-900/60 px-3.5 py-1 rounded-full border border-champagne/30">
            <Sparkles className="w-3 h-3 text-champagne" /> Atelier Executive Console
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-offwhite mt-2">
            WearOMNIA Business Intelligence
          </h1>
          <p className="text-xs text-offwhite/70 mt-1 font-sans">
            Real-time SSE event streaming, revenue analytics, and nationwide COD fulfillment distribution.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="bg-champagne text-teal-950 px-6 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-offwhite transition-all shadow-xl shrink-0 flex items-center justify-center gap-2"
        >
          Orders Console <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-champagne/80">Total COD Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-champagne/10 text-champagne flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-offwhite">Rs. {totalRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">Across {totalOrders} Nationwide Orders</span>
        </div>

        <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-champagne/80">Average Basket (AOV)</span>
            <div className="w-9 h-9 rounded-xl bg-champagne/10 text-champagne flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-offwhite">Rs. {averageOrderValue.toLocaleString()}</p>
          <span className="text-[11px] text-champagne font-semibold">Average Order Size</span>
        </div>

        <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-champagne/80">Pending Call Confirmation</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-amber-400">{pendingOrders}</p>
          <span className="text-[11px] text-amber-400 font-semibold">Requires Dispatch Call</span>
        </div>

        <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-champagne/80">Low Stock Warnings</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-red-400">{lowStockProducts}</p>
          <Link href="/admin/inventory" className="text-[11px] text-red-400 underline font-semibold block">
            View Inventory Alerts →
          </Link>
        </div>
      </div>

      {/* Regional Sales Breakdown & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* City Sales Distribution */}
        <div className="lg:col-span-6 bg-[#0A2528]/70 backdrop-blur-xl p-6 rounded-3xl border border-champagne/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-champagne/15 pb-4">
            <h3 className="font-serif text-xl font-bold text-champagne flex items-center gap-2">
              <MapPin className="w-5 h-5 text-champagne" /> Pakistan Sales Distribution
            </h3>
            <span className="text-xs text-offwhite/60 font-semibold">{citySalesList.length} Cities Covered</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {citySalesList.map((item) => {
              const percentage = totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 100) : 0;
              return (
                <div key={item.city} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-offwhite">
                    <span>{item.city} ({item.count} Orders)</span>
                    <span className="text-champagne font-mono">Rs. {item.total.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#06191B] h-2 rounded-full overflow-hidden border border-champagne/10">
                    <div className="bg-champagne h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Overview Metrics */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-champagne text-teal-950 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-2xl font-bold text-offwhite">{totalCustomers}</h4>
              <p className="text-xs text-offwhite/70">Consolidated Customer Profiles Linked By Mobile</p>
            </div>
          </div>

          <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-champagne text-teal-950 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-2xl font-bold text-offwhite">{totalProducts}</h4>
              <p className="text-xs text-charcoal-muted text-offwhite/70">Active Luxury Catalog SKUs</p>
            </div>
          </div>

          <div className="bg-[#0A2528]/60 backdrop-blur-md p-6 rounded-2xl border border-champagne/20 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-champagne text-teal-950 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-2xl font-bold text-offwhite">{confirmedOrders}</h4>
              <p className="text-xs text-offwhite/70">Confirmed Orders Ready For Dispatch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/20 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-champagne/15 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-champagne">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs uppercase font-bold text-champagne hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-champagne uppercase tracking-wider font-semibold border-b border-champagne/15">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">City</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-champagne/10">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#103A3E]/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-champagne">{order.orderNumber}</td>
                  <td className="p-4 font-semibold text-offwhite">{order.customerName}</td>
                  <td className="p-4 text-offwhite/70">{order.shippingCity}</td>
                  <td className="p-4 font-bold text-champagne">Rs. {order.totalAmount.toLocaleString()}</td>
                  <td className="p-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/orders?search=${order.orderNumber}`}
                      className="bg-champagne text-teal-950 px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] hover:bg-offwhite transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
