'use client';

import React, { useState } from 'react';
import { Tag, Plus, Check, X, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface CouponItem {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiryDate: string | Date | null;
}

export const CouponsClient: React.FC<{ initialCoupons: CouponItem[] }> = ({ initialCoupons }) => {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderAmount: '5000',
    maxDiscountAmount: '3000',
    usageLimit: '100',
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.coupon) {
        setCoupons([data.coupon, ...coupons]);
        setModalOpen(false);
        setFormData({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '10',
          minOrderAmount: '5000',
          maxDiscountAmount: '3000',
          usageLimit: '100',
        });
      } else {
        setErrorMessage(data.error || 'Failed to create coupon.');
      }
    } catch (e) {
      setErrorMessage('Network error creating coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header */}
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <Tag className="w-3 h-3 text-[#D4AF37]" /> Promotions & Discounts
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#FAF8F5] mt-2">
            Promo Coupons & Vouchers ({coupons.length})
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Create and manage percentage or fixed discount promo codes for customer checkout.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage('');
            setModalOpen(true);
          }}
          className="bg-[#D4AF37] text-black hover:bg-white px-6 py-3 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount Type</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4">Min Spend</th>
                <th className="p-4">Usage (Used / Limit)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#FAF8F5]/50 italic">
                    No promo coupons created yet. Click &quot;Create New Coupon&quot; to add one.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#103A3E]/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#D4AF37] text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#D4AF37]" /> {c.code}
                    </td>
                    <td className="p-4 font-semibold text-[#FAF8F5]">{c.discountType}</td>
                    <td className="p-4 font-bold text-emerald-400 font-mono">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                    </td>
                    <td className="p-4 text-[#FAF8F5]/80 font-mono">Rs. {c.minOrderAmount.toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-[#FAF8F5]">
                      {c.usedCount} / {c.usageLimit || '∞'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        c.isActive
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-gray-950/60 text-gray-400 border-gray-500/40'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                Create Promo Coupon
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-300 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10, EID2026"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
                  className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (PKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Min Order Spend (PKR)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D4AF37] hover:bg-white text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
