'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
  DollarSign,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import {
  getCanonicalCourierStatus,
  getCourierStatusBadgeInfo,
  getSettlementStatusBadgeInfo,
  isSettlementEligible,
} from '@/lib/courier/canonical-status';

interface ShipmentItem {
  id: string;
  orderId: string;
  provider: string;
  trackingNumber: string | null;
  orderRefNumber: string | null;
  status: string;
  codAmount: number;
  settlementStatus: string | null;
  settlementDate: string | null;
  cprNumber: string | null;
  transactionFee?: number | null;
  taxAmount?: number | null;
  fuelSurcharge?: number | null;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    shippingCity: string;
    totalAmount: number;
  };
}

export function CodSettlementClient({ initialShipments }: { initialShipments: ShipmentItem[] }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncSettlement = async (trackingNumber: string) => {
    setSyncingId(trackingNumber);
    try {
      const res = await fetch('/api/admin/courier/postex/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber }),
      });
      const data = await res.json();
      if (res.ok && data.payment) {
        setShipments((prev) =>
          prev.map((s) =>
            s.trackingNumber === trackingNumber
              ? {
                  ...s,
                  settlementStatus: data.payment.settlementStatus,
                  settlementDate: data.payment.settlementDate,
                  cprNumber: data.payment.cprNumber_1 || data.payment.cprNumber,
                  transactionFee: data.payment.transactionFee,
                  taxAmount: data.payment.taxAmount,
                }
              : s
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingId(null);
    }
  };

  // Canonical calculations
  const deliveredShipments = shipments.filter(
    (s) => getCanonicalCourierStatus(s.status) === 'DELIVERED' && Boolean(s.trackingNumber)
  );

  const totalDeliveredCod = deliveredShipments.reduce((sum, s) => sum + (s.codAmount || s.order?.totalAmount || 0), 0);

  const settledShipments = deliveredShipments.filter(
    (s) => s.settlementStatus === 'SETTLED' || s.settlementStatus === 'PAID'
  );
  const totalSettledAmount = settledShipments.reduce((sum, s) => sum + (s.codAmount || s.order?.totalAmount || 0), 0);

  const pendingSettlementShipments = deliveredShipments.filter(
    (s) => s.settlementStatus !== 'SETTLED' && s.settlementStatus !== 'PAID'
  );
  const totalPendingAmount = pendingSettlementShipments.reduce(
    (sum, s) => sum + (s.codAmount || s.order?.totalAmount || 0),
    0
  );

  const filtered = shipments.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.trackingNumber || '').toLowerCase().includes(term) ||
      (s.cprNumber || '').toLowerCase().includes(term) ||
      (s.order?.orderNumber || '').toLowerCase().includes(term) ||
      (s.order?.customerName || '').toLowerCase().includes(term) ||
      (s.order?.shippingCity || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]">Total Delivered COD</span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-2">
            Rs. {totalDeliveredCod.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1">{deliveredShipments.length} delivered parcel(s) total</div>
        </div>

        <div className="bg-[#0A2528] border border-emerald-500/30 p-5 rounded-2xl shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Settled & Remitted</span>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-2">
            Rs. {totalSettledAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">{settledShipments.length} parcel(s) with confirmed CPR</div>
        </div>

        <div className="bg-[#0A2528] border border-amber-500/30 p-5 rounded-2xl shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Pending Remittance</span>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-2">
            Rs. {totalPendingAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">
            {pendingSettlementShipments.length} delivered parcel(s) awaiting PostEx transfer
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#D4AF37]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-[#D4AF37]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tracking #, CPR #, order #, customer, city..."
              className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/20">
              <tr>
                <th className="p-3.5">Order / Tracking</th>
                <th className="p-3.5">Customer & City</th>
                <th className="p-3.5">Courier Status</th>
                <th className="p-3.5">COD Amount</th>
                <th className="p-3.5">Settlement Status</th>
                <th className="p-3.5">CPR Reference #</th>
                <th className="p-3.5">Settlement Date</th>
                <th className="p-3.5 text-right">Reconcile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#FAF8F5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#FAF8F5]/50">
                    No COD shipments matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const courierBadge = getCourierStatusBadgeInfo(s.status);
                  const settlementBadge = getSettlementStatusBadgeInfo(s.settlementStatus, s.status);
                  const isSettled = s.settlementStatus === 'SETTLED' || s.settlementStatus === 'PAID';

                  return (
                    <tr key={s.id} className="hover:bg-[#103A3E]/30 transition-colors">
                      <td className="p-3.5">
                        {s.order ? (
                          <Link href={`/admin/orders/${s.orderId}`} className="font-bold font-mono text-[#D4AF37] hover:underline block">
                            {s.order.orderNumber}
                          </Link>
                        ) : (
                          <span className="font-bold font-mono text-[#D4AF37] block">{s.orderRefNumber || 'N/A'}</span>
                        )}
                        <span className="text-[11px] font-mono text-emerald-400">{s.trackingNumber || 'Pending'}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-[#FAF8F5]">{s.order?.customerName || 'Customer'}</div>
                        <div className="text-[11px] text-[#FAF8F5]/60">{s.order?.shippingCity}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${courierBadge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${courierBadge.dotClass}`} />
                          {courierBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#FAF8F5]">
                        Rs. {(s.codAmount || s.order?.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${settlementBadge.badgeClass}`}>
                          {settlementBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-semibold text-[#FAF8F5]">
                        {s.cprNumber || '—'}
                      </td>
                      <td className="p-3.5 text-xs text-[#FAF8F5]/70">
                        {s.settlementDate ? new Date(s.settlementDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        {s.trackingNumber && (
                          <button
                            onClick={() => handleSyncSettlement(s.trackingNumber!)}
                            disabled={syncingId === s.trackingNumber}
                            className="px-2.5 py-1 bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-lg text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1"
                          >
                            {syncingId === s.trackingNumber ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Sync
                          </button>
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
