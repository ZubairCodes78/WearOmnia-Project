'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X, ShieldAlert, User, Banknote, Package } from 'lucide-react';

export interface DeleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status?: string;
    trackingNumber?: string | null;
  } | null;
}

export function DeleteOrderModal({
  isOpen,
  onClose,
  onConfirm,
  order,
}: DeleteOrderModalProps) {
  const [reason, setReason] = useState('Cancelled / Test Order');
  const [customReason, setCustomReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    setErrorMessage('');
    const finalReason = reason === 'Other' ? (customReason.trim() || 'Admin Delete') : reason;

    try {
      await onConfirm(finalReason);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete order. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0A2528] border border-red-500/40 rounded-3xl shadow-2xl overflow-hidden text-[#FAF8F5] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Red Ambient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-[#D4AF37] to-red-600" />

        {/* Header */}
        <div className="p-6 border-b border-[#D4AF37]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Destructive Business Action
              </span>
              <h2 className="font-serif text-xl font-bold text-[#FAF8F5]">Delete Order?</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#FAF8F5]/60 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Order Details Confirmation Card */}
          <div className="bg-[#06191B] border border-red-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-2.5">
              <span className="text-[11px] text-[#FAF8F5]/60 uppercase font-bold tracking-wider">Order Reference</span>
              <span className="font-mono font-bold text-sm text-[#D4AF37]">#{order.orderNumber}</span>
            </div>

            <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-2.5">
              <span className="text-[11px] text-[#FAF8F5]/60 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D4AF37]/70" /> Customer
              </span>
              <span className="font-semibold text-xs text-[#FAF8F5]">{order.customerName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-2.5">
              <span className="text-[11px] text-[#FAF8F5]/60 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Amount
              </span>
              <span className="font-mono font-bold text-sm text-emerald-400">
                Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>

            {order.trackingNumber && (
              <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-2.5">
                <span className="text-[11px] text-[#FAF8F5]/60 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#D4AF37]" /> PostEx Tracking
                </span>
                <span className="font-mono font-bold text-xs text-[#FAF8F5]/80">{order.trackingNumber}</span>
              </div>
            )}

            {order.status && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#FAF8F5]/60 uppercase font-bold tracking-wider">Current Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-800/40">
                  {order.status}
                </span>
              </div>
            )}
          </div>

          {/* Critical Warning Alert */}
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-600/30 text-xs text-red-200/90 leading-relaxed">
            <p className="font-semibold text-red-300 mb-1">Permanent Removal Policy:</p>
            This will permanently remove this order from business records, sales, revenue, profit, shipping, and COD calculations. <strong className="text-white">The customer profile will remain in Customer Base.</strong>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-bold tracking-wider text-[#D4AF37] block">
              Deletion Reason (for Audit Log)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isDeleting}
              className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-50"
            >
              <option value="Cancelled / Test Order">Cancelled / Test Order</option>
              <option value="Customer Duplicate Order">Customer Duplicate Order</option>
              <option value="Customer Cancellation Request">Customer Cancellation Request</option>
              <option value="Incorrect Address / Unreachable">Incorrect Address / Unreachable</option>
              <option value="Payment / COD Fraud Prevention">Payment / COD Fraud Prevention</option>
              <option value="Other">Other (Specify below)</option>
            </select>

            {reason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific deletion reason..."
                disabled={isDeleting}
                className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] mt-2"
                required
              />
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-xs text-red-200">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/15">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#FAF8F5]/80 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting Permanently...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
