'use client';

import React, { useState, useMemo } from 'react';
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
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
  const debouncedSearch = useDebounce(search, 300);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return shipments.filter((s) => {
      if (!term) return true;
      return (
        (s.trackingNumber || '').toLowerCase().includes(term) ||
        (s.cprNumber || '').toLowerCase().includes(term) ||
        (s.order?.orderNumber || '').toLowerCase().includes(term) ||
        (s.order?.customerName || '').toLowerCase().includes(term) ||
        (s.order?.shippingCity || '').toLowerCase().includes(term)
      );
    });
  }, [shipments, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedShipments = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      <AdminPageHeader
        title="PostEx COD Settlement Reconciliation"
        description="Live tracking of cash collected, upfront payments, CPR numbers, and bank disbursement status."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" /> Financial Operations
          </span>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A2528] border border-white/5 p-5 rounded-xl shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#D4AF37]">Total Delivered COD</span>
          <div className="text-2xl font-bold font-serif text-[#FAF8F5] mt-1">
            Rs. {totalDeliveredCod.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#FAF8F5]/50 mt-1">{deliveredShipments.length} delivered parcel(s) total</div>
        </div>

        <div className="bg-[#0A2528] border border-emerald-500/20 p-5 rounded-xl shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400">Settled & Remitted</span>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            Rs. {totalSettledAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-300/70 mt-1">{settledShipments.length} parcel(s) with confirmed CPR</div>
        </div>

        <div className="bg-[#0A2528] border border-amber-500/20 p-5 rounded-xl shadow-sm">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-amber-400">Pending Remittance</span>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-1">
            Rs. {totalPendingAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-300/70 mt-1">
            {pendingSettlementShipments.length} delivered parcel(s) awaiting transfer
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-[#0A2528] border border-white/5 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-3.5 h-3.5 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking, CPR, order, customer, city..."
              className="w-full bg-[#06191B] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#FAF8F5] placeholder:text-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B] text-[#FAF8F5]/60 font-semibold border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Order / Tracking</th>
                <th className="px-4 py-3">Customer & City</th>
                <th className="px-4 py-3">Courier Status</th>
                <th className="px-4 py-3">COD Amount</th>
                <th className="px-4 py-3">Settlement Status</th>
                <th className="px-4 py-3">CPR Reference #</th>
                <th className="px-4 py-3">Settlement Date</th>
                <th className="px-4 py-3 text-right">Reconcile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#FAF8F5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <AdminEmptyState
                      icon={CreditCard}
                      title="No COD shipments found"
                      description="No shipments match your current search or reconciliation criteria."
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
                paginatedShipments.map((s) => {
                  const courierBadge = getCourierStatusBadgeInfo(s.status);
                  const settlementBadge = getSettlementStatusBadgeInfo(s.settlementStatus, s.status);
                  const isSettled = s.settlementStatus === 'SETTLED' || s.settlementStatus === 'PAID';

                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        {s.order ? (
                          <Link href={`/admin/orders/${s.orderId}`} className="font-semibold font-mono text-[#D4AF37] hover:underline block">
                            {s.order.orderNumber}
                          </Link>
                        ) : (
                          <span className="font-semibold font-mono text-[#D4AF37] block">{s.orderRefNumber || 'N/A'}</span>
                        )}
                        <span className="text-[11px] font-mono text-emerald-400">{s.trackingNumber || 'Pending'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#FAF8F5]">{s.order?.customerName || 'Customer'}</div>
                        <div className="text-[11px] text-[#FAF8F5]/50">{s.order?.shippingCity}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${courierBadge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${courierBadge.dotClass}`} />
                          {courierBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-[#FAF8F5]">
                        Rs. {(s.codAmount || s.order?.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${settlementBadge.badgeClass}`}>
                          {settlementBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#FAF8F5]">
                        {s.cprNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#FAF8F5]/60">
                        {s.settlementDate ? new Date(s.settlementDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.trackingNumber && (
                          <button
                            onClick={() => handleSyncSettlement(s.trackingNumber!)}
                            disabled={syncingId === s.trackingNumber}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1"
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

        {filtered.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
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
