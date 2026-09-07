'use client';

import React, { useState } from 'react';
import {
  Search,
  Send,
  Loader2,
} from 'lucide-react';
import { POSTEX_STATUS_MAP } from '@/lib/courier/types';

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
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [adviceAction, setAdviceAction] = useState<'1' | '2'>('2');
  const [adviceRemarks, setAdviceRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

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

  const filtered = shipments.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.trackingNumber || '').toLowerCase().includes(term) ||
      (s.order?.orderNumber || '').toLowerCase().includes(term) ||
      (s.order?.customerName || '').toLowerCase().includes(term) ||
      (s.order?.shippingCity || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-1">Customer Care</p>
          <h1 className="font-serif text-2xl font-bold text-[#FAF8F5]">Returns & Failed Delivery Management</h1>
          <p className="text-xs text-[#FAF8F5]/60 font-sans mt-0.5">Submit immediate shipper advice and manage parcels requiring re-attempt or return.</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#D4AF37]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search return by tracking #, order #, customer, city..."
            className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2 admin-table-wrapper">
          <div className="p-5 border-b border-[#D4AF37]/15">
            <h2 className="font-serif text-base font-bold text-[#FAF8F5]">Parcels in Review / Returned</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/20">
                <tr>
                  <th className="p-3.5">Order / Tracking</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">COD Amount</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10 text-[#FAF8F5]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#FAF8F5]/50">
                      No active returns or delivery issues found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
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
                          isSelected ? 'bg-[#103A3E]/70' : 'hover:bg-[#103A3E]/30'
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="font-bold font-mono text-[#D4AF37]">{s.order?.orderNumber || 'N/A'}</div>
                          <div className="text-[11px] font-mono text-emerald-400">{s.trackingNumber || 'Pending'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#FAF8F5]">{s.order?.customerName}</div>
                          <div className="text-[11px] text-[#FAF8F5]/60">{s.order?.shippingCity}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          Rs. {s.codAmount?.toLocaleString() || s.order?.totalAmount?.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-[#103A3E] text-[#D4AF37] rounded-lg text-[10px] font-bold uppercase hover:bg-[#D4AF37] hover:text-black transition-all"
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
