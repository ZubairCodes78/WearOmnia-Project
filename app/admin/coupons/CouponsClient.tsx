'use client';

import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Check,
  X,
  Loader2,
  Trash2,
  Edit3,
  Power,
  Calendar,
  Clock,
  Globe,

  Info,
  ShieldAlert,
} from 'lucide-react';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import {
  getKarachiInputValues,
  parseKarachiDateTime,
  calculateDurationDisplay,
} from '@/lib/coupons';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export interface CouponItem {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit?: number | null;
  startDate?: string | null;
  expiryDate?: string | null;
  timezone?: string;
  isPreOrderOnly?: boolean;
  applicableProducts?: string | null;
  autoApply?: boolean;
  isActive: boolean;
  scheduleStatus?: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  statusLabel?: string;
  durationDisplay?: string;
  formattedStartDate?: string;
  formattedEndDate?: string;
  createdAt: string;
}

export const CouponsClient: React.FC<{ initialCoupons: CouponItem[] }> = ({ initialCoupons }) => {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deleteModalCoupon, setDeleteModalCoupon] = useState<CouponItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'FIXED',
    discountValue: '500',
    startDate: '2026-09-29',
    startTime: '00:00',
    endDate: '2026-10-20',
    endTime: '23:59',
    timezone: 'Asia/Karachi',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    perCustomerLimit: '',
    isPreOrderOnly: false,
    autoApply: false,
    isActive: true,
  });

  // Dedicated Pre-Order Campaign Coupon (PREORDER500)
  const preOrderCoupon = useMemo(() => {
    return coupons.find((c) => c.code.toUpperCase() === 'PREORDER500');
  }, [coupons]);

  // Real-time live duration preview for form
  const formDurationPreview = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 'Ongoing (No schedule restriction)';
    const start = parseKarachiDateTime(formData.startDate, formData.startTime);
    const end = parseKarachiDateTime(formData.endDate, formData.endTime);
    if (!start || !end) return 'Invalid date';
    return calculateDurationDisplay(start, end);
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      startDate: '',
      startTime: '00:00',
      endDate: '',
      endTime: '23:59',
      timezone: 'Asia/Karachi',
      minOrderAmount: '0',
      maxDiscountAmount: '',
      usageLimit: '',
      perCustomerLimit: '',
      isPreOrderOnly: false,
      autoApply: false,
      isActive: true,
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    const startInputs = getKarachiInputValues(coupon.startDate);
    const endInputs = getKarachiInputValues(coupon.expiryDate);

    setFormData({
      code: coupon.code,
      discountType: coupon.discountType || 'FIXED',
      discountValue: coupon.discountValue?.toString() || '',
      startDate: startInputs.date,
      startTime: startInputs.time,
      endDate: endInputs.date,
      endTime: endInputs.time,
      timezone: coupon.timezone || 'Asia/Karachi',
      minOrderAmount: (coupon.minOrderAmount || 0).toString(),
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      perCustomerLimit: coupon.perCustomerLimit ? coupon.perCustomerLimit.toString() : '',
      isPreOrderOnly: Boolean(coupon.isPreOrderOnly),
      autoApply: Boolean(coupon.autoApply),
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
      const parsedStart = formData.startDate
        ? parseKarachiDateTime(formData.startDate, formData.startTime)?.toISOString()
        : null;
      const parsedEnd = formData.endDate
        ? parseKarachiDateTime(formData.endDate, formData.endTime)?.toISOString()
        : null;

      const url = '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      const payload = {
        id: editingCoupon?.id,
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        minOrderAmount: formData.minOrderAmount || '0',
        maxDiscountAmount: formData.maxDiscountAmount || null,
        usageLimit: formData.usageLimit || null,
        perCustomerLimit: formData.perCustomerLimit || null,
        startDate: parsedStart,
        expiryDate: parsedEnd,
        timezone: formData.timezone || 'Asia/Karachi',
        isPreOrderOnly: formData.isPreOrderOnly,
        autoApply: formData.autoApply,
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
    } catch {
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
      const data = await res.json();
      if (res.ok && data.coupon) {
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data.coupon : c)));
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

  // Helper for schedule status badge rendering
  const renderStatusBadge = (status?: string, isActive?: boolean) => {
    if (!isActive || status === 'DISABLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-900/80 text-gray-400 border border-gray-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          Disabled
        </span>
      );
    }
    if (status === 'SCHEDULED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/70 text-amber-300 border border-amber-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Scheduled
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/70 text-rose-300 border border-rose-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER ───────────────────────────────────────────────────────── */}
      <AdminPageHeader
        title={`Promo Coupons & Scheduling (${coupons.length})`}
        description="Manage discount codes, campaign schedules (Asia/Karachi), pre-order rules, and redemptions."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <Tag className="w-3.5 h-3.5 text-[#D4AF37]" /> Promotional Campaigns & Vouchers
          </span>
        }
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#c49f2f] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Coupon
          </button>
        }
      />

      {/* ── 2. PRE-ORDER LAUNCH CAMPAIGN SCHEDULE HIGHLIGHT ──────────────────── */}
      {preOrderCoupon && (
        <section
          aria-label="Pre-Order Launch Campaign Schedule"
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0F3539] via-[#0C2B2E] to-[#071B1D] border-2 border-[#D4AF37]/60 shadow-2xl space-y-6"
        >
          {/* Subtle gold decorative ambient glow */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] opacity-20"
            style={{ background: '#D4AF37' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Tag className="w-3 h-3 text-[#D4AF37]" /> PRE-ORDER CAMPAIGN
                </span>
                {renderStatusBadge(preOrderCoupon.scheduleStatus, preOrderCoupon.isActive)}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-950/70 text-[#FAF8F5]/70 border border-[#D4AF37]/20">
                  Auto-Apply: OFF (Manual Only)
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-4 pt-1">
                <h2 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#D4AF37] tracking-wider">
                  {preOrderCoupon.code}
                </h2>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
                  PKR {preOrderCoupon.discountValue.toLocaleString()} OFF
                </span>
              </div>

              <p className="text-xs text-[#FAF8F5]/80 max-w-xl font-sans leading-relaxed">
                Official pre-order launch incentive. Applied to pre-order items; 50% advance payment is calculated strictly on the discounted subtotal.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => openEditModal(preOrderCoupon)}
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#D4AF37] text-black font-extrabold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Change Campaign Schedule
              </button>
            </div>
          </div>

          {/* Campaign Schedule Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#D4AF37]/20">
            {/* Starts */}
            <div className="bg-[#06191B]/80 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                <Calendar className="w-3 h-3" /> STARTS
              </div>
              <p className="font-mono text-sm sm:text-base font-bold text-[#FAF8F5]">
                {preOrderCoupon.formattedStartDate || '29 Sep 2026, 12:00 AM'}
              </p>
              <span className="text-[10px] text-[#FAF8F5]/50 block">Launch begins at midnight</span>
            </div>

            {/* Ends */}
            <div className="bg-[#06191B]/80 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                <Clock className="w-3 h-3" /> ENDS
              </div>
              <p className="font-mono text-sm sm:text-base font-bold text-[#FAF8F5]">
                {preOrderCoupon.formattedEndDate || '20 Oct 2026, 11:59 PM'}
              </p>
              <span className="text-[10px] text-[#FAF8F5]/50 block">Campaign concluding time</span>
            </div>

            {/* Timezone */}
            <div className="bg-[#06191B]/80 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                <Globe className="w-3 h-3" /> TIMEZONE
              </div>
              <p className="font-mono text-sm sm:text-base font-bold text-[#FAF8F5]">
                {preOrderCoupon.timezone || 'Asia/Karachi'}
              </p>
              <span className="text-[10px] text-[#FAF8F5]/50 block">Pakistan Standard Time (PKT)</span>
            </div>

            {/* Duration */}
            <div className="bg-[#06191B]/80 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                <Info className="w-3 h-3" /> CAMPAIGN DURATION
              </div>
              <p className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                {preOrderCoupon.durationDisplay || '21 Days, 23 Hours'}
              </p>
              <span className="text-[10px] text-[#FAF8F5]/50 block">Calculated active window</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. ALL COUPONS TABLE ────────────────────────────────────────────── */}
      <div className="admin-table-wrapper space-y-3">
        <div className="flex items-center justify-between px-2 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
            All Promo Codes & Campaigns ({coupons.length})
          </h2>
          <span className="text-[11px] text-[#FAF8F5]/60 font-sans">
            Server enforces schedule automatically via Asia/Karachi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Campaign Schedule (Asia/Karachi)</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Usage (Used / Limit)</th>
                <th className="p-4">Schedule Status</th>
                <th className="p-4">Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#FAF8F5]/50 italic">
                    No promo coupons found. Click &quot;Create New Coupon&quot; to configure one.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#103A3E]/40 transition-colors">
                    {/* Code & Badges */}
                    <td className="p-4 font-mono font-bold text-[#D4AF37] text-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{c.code}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1 font-sans">
                        {c.isPreOrderOnly && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-200 border border-teal-700/40">
                            Pre-Order Only
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-900/80 text-gray-400 border border-gray-700/40">
                          Auto-Apply: {c.autoApply ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="p-4">
                      <span className="font-bold text-emerald-400 font-mono text-sm block">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `Rs. ${c.discountValue.toLocaleString()} OFF`}
                      </span>
                      <span className="text-[10px] text-[#FAF8F5]/50 font-sans block">
                        {c.minOrderAmount > 0 ? `Min. spend Rs. ${c.minOrderAmount.toLocaleString()}` : 'No minimum spend'}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="p-4 text-xs font-mono">
                      <div className="space-y-0.5">
                        <div className="text-[#FAF8F5]/90">
                          <span className="text-[10px] text-[#D4AF37] font-sans uppercase font-bold mr-1">Starts:</span>
                          {c.formattedStartDate || 'Not set'}
                        </div>
                        <div className="text-[#FAF8F5]/90">
                          <span className="text-[10px] text-[#D4AF37] font-sans uppercase font-bold mr-1">Ends:</span>
                          {c.formattedEndDate || 'Ongoing'}
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="p-4 text-xs font-mono font-semibold text-emerald-400">
                      {c.durationDisplay || 'Ongoing'}
                    </td>

                    {/* Usage */}
                    <td className="p-4 font-mono font-bold text-[#FAF8F5] text-xs">
                      {c.usedCount} / {c.usageLimit || '∞'}
                    </td>

                    {/* Schedule Status */}
                    <td className="p-4">
                      {renderStatusBadge(c.scheduleStatus, c.isActive)}
                    </td>

                    {/* Active toggle */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all inline-flex items-center gap-1 cursor-pointer ${
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

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="admin-action-group justify-end">
                        <button
                          onClick={() => openEditModal(c)}
                          className="admin-btn border-[#D4AF37]/30 text-[#D4AF37] hover:text-black hover:bg-[#D4AF37] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteModalCoupon(c)}
                          className="admin-btn border-rose-500/30 text-rose-300 hover:bg-rose-950/50 cursor-pointer"
                          title="Permanently Delete Coupon"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. CREATE / EDIT COUPON MODAL ────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-xl font-bold text-[#D4AF37]">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Campaign Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-5 text-xs font-sans">
              {/* Row 1: Code + Discount Type + Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-[#D4AF37] uppercase mb-1 font-bold">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PREORDER500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none"
                  >
                    <option value="FIXED">Fixed Amount (PKR)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                    Discount Amount *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={formData.discountType === 'FIXED' ? '500' : '10'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* ── CAMPAIGN SCHEDULE SECTION ── */}
              <div className="rounded-2xl p-4 bg-[#06191B]/80 border border-[#D4AF37]/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4AF37]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-[#D4AF37]">
                      Campaign Scheduling (Asia/Karachi)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Duration: {formDurationPreview}
                  </span>
                </div>

                {/* Start Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                      Start Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-[#0A2528] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                      Start Time (HH:MM, PKT)
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-[#0A2528] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                      End Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-[#0A2528] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                      End Time (HH:MM, PKT)
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-[#0A2528] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                    Schedule Timezone
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.timezone}
                    className="w-full bg-[#0A2528]/50 border border-gray-700/50 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5]/60 font-mono"
                  />
                  <span className="text-[9.5px] text-[#FAF8F5]/40 mt-0.5 block">
                    All scheduling calculations are strictly evaluated against Pakistan Standard Time (UTC+05:00).
                  </span>
                </div>
              </div>

              {/* ── LIMITS & RULES SECTION ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                    Min Order Spend (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                    placeholder="Unlimited if blank"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A3A3] uppercase mb-1 font-bold">
                    Per Customer Limit
                  </label>
                  <input
                    type="number"
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: e.target.value })}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] font-mono focus:outline-none"
                    placeholder="Unlimited if blank"
                  />
                </div>
              </div>

              {/* ── TOGGLES: PRE-ORDER ONLY, AUTO-APPLY, ACTIVE ── */}
              <div className="rounded-2xl p-4 bg-[#06191B]/80 border border-[#D4AF37]/30 space-y-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-[#FAF8F5] block">Pre-Order Products Exclusivity</span>
                    <span className="text-[10px] text-[#FAF8F5]/60">Restrict coupon to pre-order collection bookings only</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isPreOrderOnly}
                    onChange={(e) => setFormData({ ...formData, isPreOrderOnly: e.target.checked })}
                    className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                  />
                </label>

                <div className="border-t border-[#D4AF37]/15 pt-2">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="font-bold text-xs text-[#FAF8F5] block">Auto Apply = OFF</span>
                      <span className="text-[10px] text-[#FAF8F5]/60">
                        Customers must manually enter the code and click Apply at checkout (Cannot be auto-applied)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-900 text-[#D4AF37] border border-[#D4AF37]/30">
                      OFF
                    </span>
                  </label>
                </div>

                <div className="border-t border-[#D4AF37]/15 pt-2">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="font-bold text-xs text-[#FAF8F5] block">Coupon Active Status</span>
                      <span className="text-[10px] text-[#FAF8F5]/60">When inactive, backend will reject coupon attempts immediately</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#D4AF37] hover:bg-white text-black px-7 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingCoupon ? 'Update Campaign Schedule' : 'Create Coupon'}
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
