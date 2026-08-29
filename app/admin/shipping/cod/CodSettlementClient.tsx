'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  DollarSign,
} from 'lucide-react';

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

  const totalCodCollected = shipments.reduce((sum, s) => sum + (s.codAmount || s.order?.totalAmount || 0), 0);
  const settledCount = shipments.filter((s) => ['SETTLED', 'Paid', 'settled'].includes(s.settlementStatus || '')).length;

  const filtered = shipments.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.trackingNumber || '').toLowerCase().includes(term) ||
      (s.cprNumber || '').toLowerCase().includes(term) ||
      (s.order?.orderNumber || '').toLowerCase().includes(term) ||
      (s.order?.customerName || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">Total COD Volume</span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-2">
            Rs. {totalCodCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1">{shipments.length} total shipments tracked</div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">Settled Parcels</span>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-2">{settledCount}</div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1">Disbursed by PostEx</div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">Pending Settlement</span>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-2">{shipments.length - settledCount}</div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1">Awaiting CPR clearance</div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#D4AF37]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-[#D4AF37]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tracking #, CPR #, order #, customer..."
              className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-[#FAF8F5]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/20">
              <tr>
                <th className="p-3.5">Order / Tracking</th>
                <th className="p-3.5">Customer & City</th>
                <th className="p-3.5">COD Amount</th>
                <th className="p-3.5">Settlement Status</th>
                <th className="p-3.5">CPR Reference #</th>
                <th className="p-3.5">Settlement Date</th>
                <th className="p-3.5 text-right">Reconcile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10 text-[#FAF8F5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#FAF8F5]/50">
                    No COD shipments matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isSettled = ['SETTLED', 'Paid', 'settled'].includes(s.settlementStatus || '');
                  return (
                    <tr key={s.id} className="hover:bg-[#103A3E]/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold font-mono text-[#D4AF37]">{s.order?.orderNumber || 'N/A'}</div>
                        <div className="text-[11px] font-mono text-emerald-400">{s.trackingNumber || 'Pending'}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-[#FAF8F5]">{s.order?.customerName}</div>
                        <div className="text-[11px] text-[#FAF8F5]/60">{s.order?.shippingCity}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#FAF8F5]">
                        Rs. {s.codAmount?.toLocaleString() || s.order?.totalAmount?.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isSettled ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-amber-950 text-amber-400 border-amber-800/40'}`}>
                          {s.settlementStatus || 'PENDING'}
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
                            {syncingId === s.trackingNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
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
