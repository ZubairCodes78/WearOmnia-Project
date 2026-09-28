'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Send,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { POSTEX_STATUS_MAP } from '@/lib/courier/types';
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
  returnReason: string | null;
  returnDate: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    shippingCity: string;
    totalAmount: number;
    status: string;
  };
}

export function ReturnsClient({ initialShipments }: { initialShipments: ShipmentItem[] }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [adviceAction, setAdviceAction] = useState<'1' | '2'>('2');
  const [adviceRemarks, setAdviceRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSubmitAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTracking) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/courier/postex/shipper-advice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: selectedTracking,
          shipperAdvice: Number(adviceAction),
          remarks: adviceRemarks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ text: data.error || 'Failed to submit advice.', isError: true });
      } else {
        setFeedback({ text: '✓ Shipper advice recorded with PostEx.' });
        setAdviceRemarks('');
      }
    } catch {
      setFeedback({ text: 'Network error submitting advice.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return shipments.filter((s) => {
      if (!term) return true;
      return (
        (s.trackingNumber || '').toLowerCase().includes(term) ||
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Returns & RTO Operations"
        description="Track non-delivered parcels, failed delivery attempts, and transmit Shipper Advice directly to the PostEx network."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" /> Reverse Logistics & Shipper Advice
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2 bg-[#0A2528] rounded-xl border border-white/5 overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <h2 className="font-semibold text-sm text-[#FAF8F5]">Parcels in Review / Returned ({filtered.length})</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tracking, order, customer..."
                  className="w-full bg-[#06191B] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#FAF8F5] placeholder:text-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#06191B] text-[#FAF8F5]/60 font-semibold border-b border-white/5">
                  <tr>
                    <th className="px-4 py-3">Order / Tracking</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">COD Amount</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#FAF8F5]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8">
                        <AdminEmptyState
                          icon={RotateCcw}
                          title="No returns found"
                          description="No active returns or delivery issues match your search criteria."
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
                      const statusMeta = POSTEX_STATUS_MAP[s.status] || {
                        label: s.status,
                        color: 'bg-zinc-800 text-zinc-300',
                      };
                      const isSelected = selectedTracking === s.trackingNumber;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => s.trackingNumber && setSelectedTracking(s.trackingNumber)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold font-mono text-[#D4AF37]">{s.order?.orderNumber || 'N/A'}</div>
                            <div className="text-[11px] font-mono text-emerald-400">{s.trackingNumber || 'Pending'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#FAF8F5]">{s.order?.customerName}</div>
                            <div className="text-[11px] text-[#FAF8F5]/50">{s.order?.shippingCity}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium">
                            Rs. {(s.codAmount || s.order?.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-white/5 text-[#D4AF37] border border-white/10 rounded-md text-[11px] font-medium hover:bg-[#D4AF37] hover:text-black transition-colors"
                            >
                              Advice
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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

        {/* Advice Panel */}
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
          <div className="border-b border-[#D4AF37]/15 pb-3">
            <h2 className="font-serif text-base font-bold text-[#FAF8F5]">PostEx Shipper Advice Form</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
              Submit operational instructions to PostEx rider dispatch.
            </p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-medium ${feedback.isError ? 'bg-red-950/40 text-red-300 border border-red-500/30' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'}`}>
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmitAdvice} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Selected Tracking #</label>
              <input
                type="text"
                required
                value={selectedTracking || ''}
                onChange={(e) => setSelectedTracking(e.target.value)}
                placeholder="Click parcel in table or enter tracking #"
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Instruction</label>
              <select
                value={adviceAction}
                onChange={(e) => setAdviceAction(e.target.value as '1' | '2')}
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5]"
              >
                <option value="2">2 — Mark Retry Attempt (Re-dispatch parcel to customer)</option>
                <option value="1">1 — Mark Return Requested (Cancel and return parcel to origin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Rider Instructions / Remarks</label>
              <textarea
                rows={3}
                value={adviceRemarks}
                onChange={(e) => setAdviceRemarks(e.target.value)}
                placeholder="e.g. Spoke to customer; available tomorrow after 2 PM."
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl p-3 text-xs text-[#FAF8F5]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedTracking}
              className="w-full bg-[#D4AF37] hover:bg-[#FAF8F5] text-black text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Transmit Advice to PostEx
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
