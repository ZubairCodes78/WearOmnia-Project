'use client';

import React, { useState } from 'react';
import { Tag, Plus, Check, X, Loader2, Sparkles, Trash2, Edit3, Power, AlertCircle } from 'lucide-react';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

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
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deleteModalCoupon, setDeleteModalCoupon] = useState<CouponItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderAmount: '5000',
    maxDiscountAmount: '3000',
    usageLimit: '100',
    isActive: true,
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      minOrderAmount: '5000',
      maxDiscountAmount: '3000',
      usageLimit: '100',
      isActive: true,
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount.toString(),
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      isActive: coupon.isActive,
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const url = '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      const payload = {
        id: editingCoupon?.id,
        code: formData.code,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        minOrderAmount: formData.minOrderAmount,
        maxDiscountAmount: formData.maxDiscountAmount,
        usageLimit: formData.usageLimit,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.coupon) {
        if (editingCoupon) {
          setCoupons((prev) => prev.map((c) => (c.id === data.coupon.id ? data.coupon : c)));
        } else {
          setCoupons([data.coupon, ...coupons]);
        }
        setModalOpen(false);
      } else {
        setErrorMessage(data.error || 'Failed to save coupon.');
      }
    } catch (e) {
      setErrorMessage('Network error saving coupon.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    const newStatus = !coupon.isActive;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: newStatus }),
      });
      if (res.ok) {
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalCoupon) return;
    const res = await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteModalCoupon.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete coupon.');
    }

    setCoupons((prev) => prev.filter((c) => c.id !== deleteModalCoupon.id));
    setDeleteModalCoupon(null);
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
            Create, edit, toggle, or permanently delete promo discount codes for customer checkout.
          </p>
        </div>
        <button
          onClick={openCreateModal}
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
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#FAF8F5]/50 italic">
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
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue.toLocaleString()} OFF`}
                    </td>
                    <td className="p-4 text-[#FAF8F5]/80 font-mono">Rs. {c.minOrderAmount.toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-[#FAF8F5]">
                      {c.usedCount} / {c.usageLimit || '∞'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all inline-flex items-center gap-1 ${
                          c.isActive
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                            : 'bg-gray-950/60 text-gray-400 border-gray-500/40 hover:bg-gray-900/80'
                        }`}
                        title="Click to toggle Active/Inactive"
                      >
                        <Power className="w-3 h-3" />
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1 shadow"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteModalCoupon(c)}
                        className="bg-red-950/40 hover:bg-red-900/70 text-red-300 border border-red-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1 shadow"
                        title="Permanently Delete Coupon"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                {editingCoupon ? 'Edit Promo Coupon' : 'Create Promo Coupon'}
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

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-sans">
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
                    placeholder="Unlimited if blank"
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
                  {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteModalCoupon)}
        onClose={() => setDeleteModalCoupon(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon?"
        itemName={deleteModalCoupon?.code || ''}
        itemType="Promo Coupon"
        warningMessage="This will permanently delete this coupon code. It will immediately cease to be redeemable on checkout. Historical orders that previously used this coupon will NOT be altered or corrupted."
      />
    </div>
  );
};
