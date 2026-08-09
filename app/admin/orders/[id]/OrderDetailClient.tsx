'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, User, MapPin, CreditCard, Truck, Clock,
  Printer, FileText, MessageSquare, Save, Loader2, CheckCircle2,
  AlertCircle, Tag, Crown, ChevronDown
} from 'lucide-react';
import { getValidNextStatuses, STATUS_LABELS, TIMELINE_STEPS, getTimelineStepIndex, isTerminalStatus } from '@/lib/order-status';
import { COURIER_OPTIONS } from '@/lib/courier/types';
import { normalizePhone } from '@/lib/phone';

interface OrderDetailClientProps {
  order: any;
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [courier, setCourier] = useState(order.courier || '');
  const [adminNote, setAdminNote] = useState(order.internalAdminNote || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const validNextStatuses = getValidNextStatuses(order.status);
  const currentStepIndex = getTimelineStepIndex(order.status);

  const handleStatusChange = async (newStatus: string) => {
    setStatusSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          courier: courier || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update status');
      } else {
        setOrder(data.order);
        router.refresh();
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: trackingNumber || undefined,
          courier: courier || undefined,
          internalAdminNote: adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
      } else {
        setOrder(data.order);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusButtonStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'PACKING': return 'bg-purple-600 hover:bg-purple-700 text-white';
      case 'DISPATCHED': return 'bg-cyan-600 hover:bg-cyan-700 text-white';
      case 'OUT_FOR_DELIVERY': return 'bg-indigo-600 hover:bg-indigo-700 text-white';
      case 'DELIVERED': return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'CANCELLED': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'RETURNED': return 'bg-orange-600 hover:bg-orange-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="flex items-center gap-2 text-champagne hover:text-offwhite transition-colors text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${order.id}/label`}
            target="_blank"
            className="bg-champagne text-teal-950 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-offwhite transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Label
          </Link>
          <Link
            href={`/admin/orders/${order.id}/invoice`}
            target="_blank"
            className="bg-teal-800 text-offwhite px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-offwhite hover:text-teal-950 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Invoice
          </Link>
          <button
            onClick={() => {
              const cleanPhone = normalizePhone(order.customerPhone);
              const msg = encodeURIComponent(`Hi ${order.customerName},\nRegarding your WearOMNIA order #${order.orderNumber}.`);
              window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
            }}
            className="bg-emerald-600/90 text-white px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>
        </div>
      </div>

      {/* Order Header */}
      <div className="bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-champagne/20 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-champagne block">
              Order Details
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-offwhite mt-1">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-offwhite/60 mt-1 font-mono">
              Placed: {new Date(order.createdAt).toLocaleDateString('en-PK', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-champagne/20 text-champagne px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-champagne/30">
              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
            </span>
            {order.customer?.isVIP && (
              <span className="bg-amber-500/30 text-amber-200 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border border-amber-500/30">
                <Crown className="w-3 h-3" /> VIP
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/40 text-red-200 border border-red-700/50 p-3 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          {/* Products Card */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-4">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" /> Ordered Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-3 bg-[#06191B] rounded-2xl border border-champagne/10">
                  <div className="w-16 h-20 rounded-xl bg-teal-900/60 overflow-hidden shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.productTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-champagne/40">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-serif font-bold text-offwhite text-sm truncate">{item.productTitle}</h4>
                      <p className="text-[11px] text-offwhite/60 mt-0.5">{item.variantInfo || 'Standard'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-offwhite/60">
                        Rs. {item.unitPrice.toLocaleString()} × {item.quantity}
                      </span>
                      <span className="font-bold text-champagne font-mono">
                        Rs. {item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-4">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#06191B] p-4 rounded-2xl border border-champagne/10">
                <span className="text-champagne/70 block mb-1">Full Name</span>
                <span className="font-semibold text-offwhite text-sm">{order.customerName}</span>
              </div>
              <div className="bg-[#06191B] p-4 rounded-2xl border border-champagne/10">
                <span className="text-champagne/70 block mb-1">Phone</span>
                <span className="font-semibold text-offwhite font-mono">{order.customerPhone}</span>
              </div>
              <div className="bg-[#06191B] p-4 rounded-2xl border border-champagne/10">
                <span className="text-champagne/70 block mb-1">WhatsApp</span>
                <span className="font-semibold text-offwhite font-mono">{order.customerWhatsapp || order.customerPhone}</span>
              </div>
              <div className="bg-[#06191B] p-4 rounded-2xl border border-champagne/10">
                <span className="text-champagne/70 block mb-1">Email</span>
                <span className="font-semibold text-offwhite">{order.customerEmail || 'Not Provided'}</span>
              </div>
            </div>
            {order.customer && (
              <div className="flex items-center gap-3 pt-2 text-[10px] text-offwhite/50">
                <span>Total Orders: <strong className="text-champagne">{order.customer.ordersCount}</strong></span>
                <span>•</span>
                <span>Lifetime Value: <strong className="text-champagne">Rs. {order.customer.totalSpent?.toLocaleString() || '0'}</strong></span>
              </div>
            )}
          </div>

          {/* Delivery Address Card */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-3">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Delivery Address
            </h3>
            <div className="bg-[#06191B] p-4 rounded-2xl border border-champagne/10 text-xs text-offwhite space-y-1">
              <p className="font-semibold text-sm">{order.customerName}</p>
              <p className="text-offwhite/80">{order.shippingAddress}</p>
              <p className="text-offwhite/80 font-semibold uppercase">
                {order.shippingCity}, {order.shippingProvince} {order.postalCode || ''}
              </p>
              <p className="text-offwhite/60 pt-1">Phone: {order.customerPhone}</p>
            </div>
            {order.orderNotes && (
              <div className="bg-amber-900/20 border border-amber-700/30 p-3 rounded-xl text-xs text-amber-200">
                <span className="font-bold block mb-1">Customer Notes:</span>
                {order.orderNotes}
              </div>
            )}
          </div>

          {/* Order Timeline */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-4">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Order Timeline
            </h3>
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-champagne/40 to-champagne/10" />
              {order.timeline?.map((entry: any, index: number) => (
                <div key={entry.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 relative shrink-0 text-[10px] ${
                    index === 0
                      ? 'bg-champagne text-teal-950 border-2 border-teal shadow-md'
                      : 'bg-teal-800 text-champagne border border-champagne/30'
                  }`}>
                    {index === 0 ? '●' : '○'}
                  </div>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase ${index === 0 ? 'text-champagne' : 'text-offwhite/80'}`}>
                        {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS] || entry.status}
                      </span>
                      {entry.previousStatus && (
                        <span className="text-[9px] text-offwhite/40">
                          from {entry.previousStatus}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-[11px] text-offwhite/60 mt-0.5">{entry.note}</p>
                    )}
                    <p className="text-[10px] text-offwhite/40 font-mono mt-0.5">
                      {new Date(entry.createdAt).toLocaleString('en-PK', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} • by {entry.updatedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Control */}
          <div className="bg-[#0A2528]/80 backdrop-blur-xl rounded-3xl border border-champagne/20 p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              Order Status Control
            </h3>

            <div className="text-center py-2">
              <span className="text-lg font-serif font-bold text-offwhite">
                {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
              </span>
            </div>

            {validNextStatuses.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] text-offwhite/50 uppercase tracking-wider">Available Actions:</p>
                <div className="flex flex-wrap gap-2">
                  {validNextStatuses.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={statusSaving}
                      className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all duration-300 disabled:opacity-50 ${getStatusButtonStyle(nextStatus)}`}
                    >
                      {statusSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : STATUS_LABELS[nextStatus as keyof typeof STATUS_LABELS] || nextStatus}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-offwhite/50 italic">
                  This order is in a terminal state. No further status changes are available.
                </p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-3">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment Summary
            </h3>
            <div className="space-y-2 text-xs text-offwhite/80">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-champagne">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount {order.couponCode && `(${order.couponCode})`}:</span>
                  <span>- Rs. {order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
              </div>
              {order.codCharges > 0 && (
                <div className="flex justify-between">
                  <span>COD Charges:</span>
                  <span>Rs. {order.codCharges}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-champagne pt-2 border-t border-champagne/20">
                <span>Total Collectable (COD):</span>
                <span>Rs. {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Courier & Tracking */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-4">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4" /> Courier & Tracking
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-offwhite/50 uppercase tracking-wider block mb-1.5">Courier</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#06191B] rounded-xl text-xs text-champagne border border-champagne/20 focus:outline-none focus:ring-1 focus:ring-champagne"
                >
                  <option value="">Select Courier</option>
                  {COURIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-offwhite/50 uppercase tracking-wider block mb-1.5">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number..."
                  className="w-full px-3 py-2.5 bg-[#06191B] rounded-xl text-xs text-offwhite border border-champagne/20 focus:outline-none focus:ring-1 focus:ring-champagne font-mono"
                />
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-3">
            <h3 className="text-xs font-bold text-champagne uppercase tracking-wider">
              Internal Admin Notes
            </h3>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this order..."
              className="w-full px-3 py-2.5 bg-[#06191B] rounded-xl text-xs text-offwhite border border-champagne/20 focus:outline-none focus:ring-1 focus:ring-champagne resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveDetails}
            disabled={saving}
            className="w-full bg-champagne text-teal-950 py-3 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-offwhite transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saveSuccess ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved Successfully</>
            ) : (
              <><Save className="w-4 h-4" /> Save Courier & Notes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
