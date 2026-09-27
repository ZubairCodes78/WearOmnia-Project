'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer, Search, CheckSquare, Square, AlertCircle, FileCheck, ArrowUpRight, ExternalLink } from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  totalAmount: number;
  codCharges: number;
  status: string;
  trackingNumber: string | null;
  courier: string | null;
  createdAt: string;
  isPreOrder?: boolean;
  preOrderRemainingAmount?: number | null;
  shipments: Array<{
    id: string;
    trackingNumber: string | null;
    status: string;
    codAmount: number;
  }>;
}

interface LabelsClientProps {
  initialOrders: OrderItem[];
}

export function LabelsClient({ initialOrders }: LabelsClientProps) {
  const [orders] = useState<OrderItem[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'READY' | 'MISSING'>('READY');
  const [isPrinting, setIsPrinting] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const hasTracking = Boolean(o.trackingNumber || o.shipments?.[0]?.trackingNumber);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search.toLowerCase())) ||
      o.shippingCity.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'READY') return hasTracking;
    if (filterMode === 'MISSING') return !hasTracking;
    return true;
  });

  const readyOrders = filteredOrders.filter((o) => Boolean(o.trackingNumber || o.shipments?.[0]?.trackingNumber));

  const toggleSelectAll = () => {
    if (selectedIds.length === readyOrders.length && readyOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(readyOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string, hasTracking: boolean) => {
    if (!hasTracking) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrintBatch = () => {
    if (selectedIds.length === 0) return;
    setIsPrinting(true);

    const eligibleOrders = orders.filter((o) => selectedIds.includes(o.id));
    const trackingNumbers = eligibleOrders
      .map((o) => o.trackingNumber || o.shipments?.[0]?.trackingNumber)
      .filter((t): t is string => Boolean(t));

    if (trackingNumbers.length === 0) {
      alert('None of the selected orders have a valid PostEx tracking number.');
      setIsPrinting(false);
      return;
    }

    // Call official merged PDF endpoint
    const url = `/api/admin/courier/postex/label?trackingNumbers=${encodeURIComponent(trackingNumbers.join(','))}`;
    window.open(url, '_blank');
    setTimeout(() => setIsPrinting(false), 1000);
  };

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Courier Operations</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
            PostEx Airway Bill Labels
          </h1>
          <p className="text-xs text-[#FAF8F5]/60 font-sans mt-0.5">
            Select dispatched orders with active tracking numbers to generate combined, official PostEx PDF labels.
          </p>
        </div>

        {/* Bulk Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintBatch}
            disabled={selectedIds.length === 0 || isPrinting}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
              selectedIds.length > 0 && !isPrinting
                ? 'bg-[#D4AF37] text-black hover:bg-white'
                : 'bg-[#103A3E]/60 text-[#FAF8F5]/40 border border-[#D4AF37]/20 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'Preparing PDF...' : `Print Selected (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A2528] p-3 rounded-2xl border border-[#D4AF37]/20 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Order #, tracking #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 border border-[#D4AF37]/25 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'READY'
                ? 'bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40'
                : 'text-[#FAF8F5]/60 hover:text-[#FAF8F5]'
            }`}
          >
            Tracking Available
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40'
                : 'text-[#FAF8F5]/60 hover:text-[#FAF8F5]'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilterMode('MISSING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'MISSING'
                ? 'bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40'
                : 'text-[#FAF8F5]/60 hover:text-[#FAF8F5]'
            }`}
          >
            Missing Tracking
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B]/80 text-[#D4AF37] font-mono text-[10px] uppercase tracking-wider border-b border-[#D4AF37]/20">
              <tr>
                <th className="p-3.5 w-12 text-center">
                  <button
                    onClick={toggleSelectAll}
                    disabled={readyOrders.length === 0}
                    className="cursor-pointer text-[#D4AF37]"
                    title="Select all eligible orders"
                  >
                    {selectedIds.length === readyOrders.length && readyOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#D4AF37]/60" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Order #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">City</th>
                <th className="p-3.5">Tracking Number</th>
                <th className="p-3.5">COD Amount</th>
                <th className="p-3.5">Shipment Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#FAF8F5]/50">
                    No orders matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const tracking = order.trackingNumber || order.shipments?.[0]?.trackingNumber;
                  const isEligible = Boolean(tracking);
                  const isSelected = selectedIds.includes(order.id);
                  const codVal = order.isPreOrder
                    ? (order.preOrderRemainingAmount || 0)
                    : order.totalAmount;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-[#103A3E]/30 transition-colors ${
                        isSelected ? 'bg-[#103A3E]/50' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectOne(order.id, isEligible)}
                          disabled={!isEligible}
                          className={isEligible ? 'cursor-pointer text-[#D4AF37]' : 'cursor-not-allowed opacity-30 text-[#FAF8F5]/30'}
                          title={isEligible ? 'Toggle selection' : 'PostEx tracking number not available'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline flex items-center gap-1">
                          {order.orderNumber}
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold block text-[#FAF8F5]">{order.customerName}</span>
                        <span className="text-[10px] text-[#FAF8F5]/60 font-mono">{order.customerPhone}</span>
                      </td>
                      <td className="p-3.5 text-[#FAF8F5]/80">{order.shippingCity}</td>
                      <td className="p-3.5 font-mono">
                        {tracking ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">{tracking}</span>
                            <a
                              href={`https://postex.pk/tracking?trackingNumber=${encodeURIComponent(tracking)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#D4AF37] hover:underline"
                              title="View on PostEx"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400/80 text-[10px] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                            <AlertCircle className="w-3 h-3" /> Not Dispatched
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        Rs. {codVal.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#06191B] text-[#FAF8F5]/80 border border-[#D4AF37]/20">
                          {order.shipments?.[0]?.status || order.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isEligible ? (
                          <a
                            href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(tracking!)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors font-bold text-[10px] uppercase tracking-wider border border-[#D4AF37]/30"
                          >
                            <Printer className="w-3 h-3" /> Print Label
                          </a>
                        ) : (
                          <Link
                            href={`/admin/shipping/postex`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-950/60 text-amber-300 text-[10px] font-bold hover:underline"
                          >
                            Dispatch First →
                          </Link>
                        )}
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
