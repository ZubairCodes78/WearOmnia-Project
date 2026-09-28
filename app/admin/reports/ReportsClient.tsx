'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  Truck,
  RotateCcw,
  DollarSign,
  Search,
  Package,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
  const [reportType, setReportType] = useState<'sales' | 'courier'>('sales');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const deliveryRate = metrics.totalOrders > 0
    ? Math.round((metrics.deliveredOrdersCount / metrics.totalOrders) * 100)
    : 0;

  const rtoRate = metrics.totalOrders > 0
    ? Math.round((metrics.returnedOrdersCount / metrics.totalOrders) * 100)
    : 0;

  const avgOrderValue = metrics.totalOrders > 0
    ? Math.round(metrics.totalRevenue / metrics.totalOrders)
    : 0;

  const filteredOrders = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (reportType === 'courier' && o.courier !== 'POSTEX' && !o.courier?.toLowerCase().includes('postex')) {
        // In courier tab, can focus on courier parcels or all
      }
      if (!term) return true;
      return (
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.shippingCity.toLowerCase().includes(term) ||
        o.status.toLowerCase().includes(term)
      );
    });
  }, [orders, debouncedSearch, reportType]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, reportType]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Executive Analytics & Performance"
        description="Real-time commercial analytics across sales volume, inventory valuation, delivery fulfillment, and courier SLAs."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" /> Commercial Intelligence
          </span>
        }
      />

      {/* Top Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A2528] rounded-xl border border-white/5 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#D4AF37] block">
            Commercial Gross Revenue
          </span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-1">
            Rs. {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> AOV: Rs. {avgOrderValue.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-emerald-500/20 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400 block">
            Delivered Realized Revenue
          </span>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            Rs. {metrics.deliveredRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#FAF8F5]/50 mt-1">
            {metrics.deliveredOrdersCount} completed orders
          </div>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-white/5 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#D4AF37] block">
            Inventory Stock Valuation
          </span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-1">
            Rs. {metrics.stockValuation.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#FAF8F5]/50 mt-1 font-mono">
            {metrics.totalStockUnits} apparel pieces on hand
          </div>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-amber-500/20 p-5 shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-amber-400 block">
            Fulfillment Delivery Rate
          </span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-1">
            {deliveryRate}%
          </div>
          <div className="text-[11px] text-amber-300/70 mt-1 font-mono">
            RTO Rate: {rtoRate}% ({metrics.returnedOrdersCount} returns)
          </div>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              reportType === 'sales'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Sales &amp; Transactions
          </button>
          <button
            onClick={() => setReportType('courier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              reportType === 'courier'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Courier Logistics SLA
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, city, status..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#06191B] rounded-lg text-xs text-[#FAF8F5] border border-white/10 focus:outline-none focus:border-[#D4AF37]/50 font-sans placeholder:text-[#FAF8F5]/30 transition-colors"
          />
        </div>
      </div>

      {/* Report Content Table */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B] text-[#FAF8F5]/60 font-semibold border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer & City</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Courier Channel</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#FAF8F5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      icon={Package}
                      title="No transactions found"
                      description="No records match your current search or report criteria."
                      action={
                        search
                          ? {
                              label: 'Clear Search',
                              onClick: () => setSearch(''),
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold font-mono text-[#D4AF37]">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#FAF8F5]">{o.customerName}</div>
                      <div className="text-[11px] text-[#FAF8F5]/50">{o.shippingCity}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[#FAF8F5]/80 border border-white/10">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{o.courier || 'PostEx'}</td>
                    <td className="px-4 py-3 font-mono font-medium">Rs. {o.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#FAF8F5]/50">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
