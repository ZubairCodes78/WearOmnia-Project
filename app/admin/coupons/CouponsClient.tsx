'use client';

import React, { useState } from 'react';
import { Tag, Plus, Check, X } from 'lucide-react';

export const CouponsClient: React.FC<{ initialCoupons: any[] }> = ({ initialCoupons }) => {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '5000',
    maxDiscountAmount: '3000',
    usageLimit: '100',
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons([data.coupon, ...coupons]);
        setModalOpen(false);
        setFormData({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          minOrderAmount: '5000',
          maxDiscountAmount: '3000',
          usageLimit: '100',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-offwhite p-6 rounded-3xl border border-sand shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne-700">Promotions</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal mt-1">Promo Coupons ({coupons.length})</h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-teal text-champagne px-6 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 text-champagne" /> Create New Coupon
        </button>
      </div>

      <div className="bg-offwhite rounded-3xl border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand text-charcoal uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount Type</th>
                <th className="p-4">Value</th>
                <th className="p-4">Min Spend</th>
                <th className="p-4">Used / Limit</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-sand/40">
                  <td className="p-4 font-mono font-bold text-teal flex items-center gap-2">
                    <Tag className="w-4 h-4 text-champagne-700" /> {c.code}
                  </td>
                  <td className="p-4 font-semibold text-charcoal">{c.discountType}</td>
                  <td className="p-4 font-bold text-teal">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                  </td>
                  <td className="p-4 text-charcoal-muted">Rs. {c.minOrderAmount.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-charcoal">
                    {c.usedCount} / {c.usageLimit || '∞'}
                  </td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-offwhite w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative border border-champagne">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2 text-charcoal">
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-sand pb-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-champagne-700">Promotions</span>
              <h3 className="font-serif text-2xl font-bold text-teal">Create New Coupon</h3>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-teal block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EID2026"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-sand rounded-xl border border-sand font-mono uppercase focus:outline-none focus:ring-1 focus:ring-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-teal block mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-sand rounded-xl border border-sand focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (PKR)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-teal block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 bg-sand rounded-xl border border-sand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-teal block mb-1">Min Order Amount (PKR)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-sand rounded-xl border border-sand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-teal block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 bg-sand rounded-xl border border-sand focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-champagne py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow"
              >
                {loading ? 'Creating...' : 'Save Promo Code'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
