'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  Truck,
  RotateCcw,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface ReportsClientProps {
  metrics: {
    totalRevenue: number;
    deliveredRevenue: number;
    totalOrders: number;
    deliveredOrdersCount: number;
    returnedOrdersCount: number;
    totalStockUnits: number;
    stockValuation: number;
    postexShipmentsCount: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    shippingCity: string;
    totalAmount: number;
    status: string;
    courier: string | null;
    createdAt: string;
  }>;
}

export function ReportsClient({ metrics, orders }: ReportsClientProps) {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'courier'>('sales');

  const deliveryRate = metrics.totalOrders > 0
    ? Math.round((metrics.deliveredOrdersCount / metrics.totalOrders) * 100)
    : 0;

  const rtoRate = metrics.totalOrders > 0
    ? Math.round((metrics.returnedOrdersCount / metrics.totalOrders) * 100)
    : 0;

  const avgOrderValue = metrics.totalOrders > 0
    ? Math.round(metrics.totalRevenue / metrics.totalOrders)
    : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]/80 block">
            Commercial Gross Revenue
          </span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-2">
            Rs. {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> AOV: Rs. {avgOrderValue.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]/80 block">
            Delivered Realized Revenue
          </span>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-2">
            Rs. {metrics.deliveredRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1">
            {metrics.deliveredOrdersCount} completed orders
          </div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]/80 block">
            Inventory Stock Valuation
          </span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-2">
            Rs. {metrics.stockValuation.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#D4AF37]/80 mt-1 font-mono">
            {metrics.totalStockUnits} apparel pieces on hand
          </div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]/80 block">
            Fulfillment Delivery Rate
          </span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-2">
            {deliveryRate}%
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">
            RTO Rate: {rtoRate}% ({metrics.returnedOrdersCount} returns)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D4AF37]/20 pb-2">
        <button
          onClick={() => setReportType('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            reportType === 'sales'
              ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15'
              : 'bg-[#0A2528] text-[#FAF8F5]/70 hover:text-[#D4AF37]'
          }`}
        >
          Sales & Order Volume
        </button>
        <button
          onClick={() => setReportType('courier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            reportType === 'courier'
              ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15'
              : 'bg-[#0A2528] text-[#FAF8F5]/70 hover:text-[#D4AF37]'
          }`}
        >
          Courier Logistics SLA
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
          <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">
            {reportType === 'sales' ? 'Orders Transaction Audit' : 'PostEx Logistics Dispatch Report'}
          </h2>
          <span className="text-xs font-mono text-[#D4AF37]/80">{orders.length} total records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/20">
              <tr>
                <th className="p-3.5">Order #</th>
                <th className="p-3.5">Customer & City</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5">Courier Channel</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10 text-[#FAF8F5]">
              {orders.slice(0, 50).map((o) => (
                <tr key={o.id} className="hover:bg-[#103A3E]/40 transition-colors">
                  <td className="p-3.5 font-bold font-mono text-[#D4AF37]">{o.orderNumber}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-[#FAF8F5]">{o.customerName}</div>
                    <div className="text-[11px] text-[#FAF8F5]/60">{o.shippingCity}</div>
                  </td>
                  <td className="p-3.5 font-bold text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-emerald-400">{o.courier || 'PostEx'}</td>
                  <td className="p-3.5 font-mono font-bold">Rs. {o.totalAmount.toLocaleString()}</td>
                  <td className="p-3.5 text-right text-[#FAF8F5]/60">
                    {new Date(o.createdAt).toLocaleDateString()}
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
