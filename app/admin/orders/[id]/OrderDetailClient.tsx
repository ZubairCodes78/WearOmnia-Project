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
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentMessage, setShipmentMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [refreshingTracking, setRefreshingTracking] = useState(false);
  const [checkingSettlement, setCheckingSettlement] = useState(false);
  const [cancellingShipment, setCancellingShipment] = useState(false);
  const [trackingDetails, setTrackingDetails] = useState<any>(null);
  const [settlementDetails, setSettlementDetails] = useState<any>(null);

  const handleCreateShipment = async (providerName: string = 'POSTEX') => {
    setCreatingShipment(true);
    setError('');
    setShipmentMessage('');
    try {
      const res = await fetch('/api/admin/courier/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          providerName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create PostEx shipment');
      } else {
        setShipmentMessage(data.message || 'PostEx shipment created successfully!');
        if (data.shipment?.trackingNumber) {
          setTrackingNumber(data.shipment.trackingNumber);
        }
        if (data.shipment?.provider) {
          setCourier(data.shipment.provider);
        }
        router.refresh();
      }
    } catch (e) {
      setError('Failed to create shipment. Network error.');
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleRefreshTracking = async () => {
    if (!trackingNumber && !order.trackingNumber) return;
    setRefreshingTracking(true);
    setError('');
    setShipmentMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: trackingNumber || order.trackingNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to refresh tracking from PostEx.');
      } else {
        setTrackingDetails(data.tracking);
        setShipmentMessage('Tracking details refreshed successfully from PostEx.');
        router.refresh();
      }
    } catch (e) {
      setError('Network error refreshing tracking.');
    } finally {
      setRefreshingTracking(false);
    }
  };

  const handleCheckSettlement = async () => {
    if (!trackingNumber && !order.trackingNumber) return;
    setCheckingSettlement(true);
    setError('');
    setShipmentMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: trackingNumber || order.trackingNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch settlement info from PostEx.');
      } else {
        setSettlementDetails(data.payment);
        setShipmentMessage('Settlement information updated from PostEx.');
        router.refresh();
      }
    } catch (e) {
      setError('Network error checking settlement.');
    } finally {
      setCheckingSettlement(false);
    }
  };

  const handleCancelPostExShipment = async () => {
    if (!confirm('Are you sure you want to cancel this shipment on PostEx?')) return;
    setCancellingShipment(true);
    setError('');
    setShipmentMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: trackingNumber || order.trackingNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to cancel PostEx shipment.');
      } else {
        setShipmentMessage('PostEx shipment cancelled successfully.');
        router.refresh();
      }
    } catch (e) {
      setError('Network error cancelling shipment.');
    } finally {
      setCancellingShipment(false);
    }
  };

  const handleCopyTracking = () => {
    const target = trackingNumber || order.trackingNumber;
    if (target && typeof window !== 'undefined') {
      navigator.clipboard.writeText(target);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

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
            href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(order.trackingNumber || trackingNumber || '')}`}
            target="_blank"
            className="bg-champagne text-teal-950 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-offwhite transition-colors flex items-center gap-1.5 shadow"
          >
            <Printer className="w-3.5 h-3.5" /> PostEx Label (PDF)
          </Link>
          <Link
            href={`/admin/orders/${order.id}/label`}
            target="_blank"
            className="bg-teal-900/80 text-champagne border border-champagne/20 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-teal-800 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Thermal Label
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
              <Clock className="w-4 h-4" /> Order Timeline & Logs
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

            {/* Quick Confirm Order Button for PLACED/PENDING status */}
            {(order.status === 'PENDING' || order.status === 'PLACED') && (
              <button
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={statusSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {statusSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirm Order
              </button>
            )}

            {validNextStatuses.length > 0 ? (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] text-offwhite/50 uppercase tracking-wider">Available Status Transitions:</p>
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

          {/* Courier & Shipping Section */}
          <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/15 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-champagne/15 pb-3">
              <h3 className="text-xs font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4" /> PostEx Courier & Logistics
              </h3>
              <span className="text-[10px] font-mono uppercase bg-champagne/10 text-champagne px-2.5 py-0.5 rounded-full border border-champagne/20">
                {courier || 'PostEx'}
              </span>
            </div>

            {shipmentMessage && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-medium">
                {shipmentMessage}
              </div>
            )}

            {/* PostEx Workflow Logic */}
            {(() => {
              const activeShipment = order.shipments?.find(
                (s: any) => s.status !== 'FAILED' && s.status !== 'CANCELLED'
              );
              const failedShipment = order.shipments?.find((s: any) => s.status === 'FAILED');
              const isOrderPlaced = order.status === 'PENDING' || order.status === 'PLACED';
              const currentTracking = activeShipment?.trackingNumber || order.trackingNumber || trackingNumber;

              if (isOrderPlaced) {
                return (
                  <div className="p-4 bg-blue-900/20 border border-blue-700/30 text-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-300">
                      <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" /> Order Status: PLACED
                    </div>
                    <p className="text-[11px] text-blue-200/80 leading-relaxed">
                      Review customer and item details, then click <strong>"Confirm Order"</strong> to enable sending this shipment to PostEx.
                    </p>
                    <button
                      onClick={() => handleStatusChange('CONFIRMED')}
                      disabled={statusSaving}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {statusSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Order'}
                    </button>
                  </div>
                );
              }

              if (activeShipment || currentTracking) {
                const settlement = settlementDetails || activeShipment;
                const tracking = trackingDetails;

                return (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-2xl space-y-4">
                    {/* Header with status */}
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                          PostEx Shipment Active
                        </span>
                        <span className="text-[10px] text-offwhite/50 font-mono">
                          Ref: {activeShipment?.orderRefNumber || order.orderNumber}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold uppercase border border-emerald-500/30">
                        {tracking?.rawStatus || activeShipment?.status || 'Booked'}
                      </span>
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-[#06191B] p-3.5 rounded-xl border border-champagne/15">
                      <div>
                        <span className="text-[10px] text-offwhite/50 font-sans block">Courier Provider:</span>
                        <span className="font-semibold text-offwhite font-sans">PostEx Express</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-offwhite/50 font-sans block">Tracking Number:</span>
                        <span className="font-bold text-champagne break-all">{currentTracking || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-offwhite/50 font-sans block">COD Amount:</span>
                        <span className="font-bold text-emerald-400">Rs. {order.totalAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-offwhite/50 font-sans block">Settlement Status:</span>
                        <span className="font-semibold text-amber-300 uppercase">{settlement?.settlementStatus || 'Pending'}</span>
                      </div>

                      {/* Optional Date details */}
                      {activeShipment?.createdAt && (
                        <div>
                          <span className="text-[10px] text-offwhite/50 font-sans block">Shipment Created:</span>
                          <span className="text-offwhite/80">{new Date(activeShipment.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}

                      {settlement?.settlementDate && (
                        <div>
                          <span className="text-[10px] text-offwhite/50 font-sans block">Settlement Date:</span>
                          <span className="text-offwhite/80">{new Date(settlement.settlementDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {settlement?.cprNumber && (
                        <div>
                          <span className="text-[10px] text-offwhite/50 font-sans block">CPR Number:</span>
                          <span className="text-champagne font-bold">{settlement.cprNumber}</span>
                        </div>
                      )}

                      {activeShipment?.deliveryDate && (
                        <div>
                          <span className="text-[10px] text-offwhite/50 font-sans block">Delivery Date:</span>
                          <span className="text-emerald-400">{new Date(activeShipment.deliveryDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {(activeShipment?.transactionFee || activeShipment?.taxAmount) && (
                        <div className="sm:col-span-2 pt-1 border-t border-champagne/10 flex justify-between text-[11px]">
                          <span className="text-offwhite/60 font-sans">PostEx Charges & Tax:</span>
                          <span className="text-offwhite font-mono">
                            Rs. {((activeShipment.transactionFee || 0) + (activeShipment.taxAmount || 0) + (activeShipment.fuelSurcharge || 0)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyTracking}
                        className="bg-champagne/10 hover:bg-champagne/20 text-champagne border border-champagne/30 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors"
                      >
                        {copySuccess ? 'Copied!' : 'Copy Tracking'}
                      </button>

                      <a
                        href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(currentTracking)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-amber-500 hover:bg-amber-400 text-teal-950 font-bold px-3.5 py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print PostEx Label
                      </a>

                      <button
                        type="button"
                        onClick={handleRefreshTracking}
                        disabled={refreshingTracking}
                        className="bg-teal-900/80 hover:bg-teal-800 text-champagne border border-champagne/20 px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {refreshingTracking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />} Refresh Tracking
                      </button>

                      <button
                        type="button"
                        onClick={handleCheckSettlement}
                        disabled={checkingSettlement}
                        className="bg-teal-900/80 hover:bg-teal-800 text-emerald-300 border border-emerald-500/20 px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {checkingSettlement ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />} Check Settlement
                      </button>

                      <a
                        href={`https://postex.pk/tracking?trackingNumber=${encodeURIComponent(currentTracking)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#06191B] hover:bg-teal-950 text-offwhite/80 border border-champagne/20 px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" /> Track on PostEx
                      </a>

                      {activeShipment?.status !== 'CANCELLED' && activeShipment?.status !== 'Delivered' && (
                        <button
                          type="button"
                          onClick={handleCancelPostExShipment}
                          disabled={cancellingShipment}
                          className="bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/30 px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50 ml-auto"
                        >
                          {cancellingShipment ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel Shipment'}
                        </button>
                      )}
                    </div>

                    {/* Tracking History Preview if Available */}
                    {tracking?.history && tracking.history.length > 0 && (
                      <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-champagne/80 tracking-wider block">
                          Recent Tracking Events:
                        </span>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {tracking.history.map((h: any, idx: number) => (
                            <div key={idx} className="bg-[#06191B]/80 p-2 rounded-lg text-[11px] flex justify-between items-start border border-champagne/10 font-mono">
                              <div>
                                <span className="font-bold text-champagne">{h.status}</span>
                                {h.remarks && <p className="text-offwhite/60 text-[10px] font-sans">{h.remarks}</p>}
                              </div>
                              <span className="text-[9px] text-offwhite/40">{h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (failedShipment || error) {
                return (
                  <div className="p-4 bg-red-900/20 border border-red-700/30 text-red-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-red-300">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> PostEx shipment could not be created.
                    </div>
                    <p className="text-[11px] text-red-200/80">
                      {error || shipmentMessage || 'PostEx API request failed or credentials missing. Order remains CONFIRMED.'}
                    </p>
                    {(error?.includes('Admin Settings') || shipmentMessage?.includes('Admin Settings')) && (
                      <Link
                        href="/admin/settings"
                        className="inline-block text-xs text-amber-300 underline hover:text-amber-200 font-semibold"
                      >
                        → Go to Admin Settings to Configure PostEx Pickup Address
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCreateShipment('POSTEX')}
                      disabled={creatingShipment}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-teal-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {creatingShipment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Retry Send to PostEx'}
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-900/10 border border-emerald-700/20 rounded-xl text-xs text-emerald-300">
                    ✓ Order status is <strong>CONFIRMED</strong>. Ready to create PostEx courier shipment.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateShipment('POSTEX')}
                    disabled={creatingShipment}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-teal-950 font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingShipment ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending to PostEx API...</>
                    ) : (
                      <><Truck className="w-4 h-4" /> Send to PostEx</>
                    )}
                  </button>
                </div>
              );
            })()}

            {/* Manual Courier Override Controls */}
            <div className="pt-2 border-t border-champagne/15 space-y-3">
              <span className="text-[10px] text-offwhite/50 uppercase tracking-wider block">Manual Shipping Override</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full px-3 py-2 bg-[#06191B] rounded-xl text-xs text-champagne border border-champagne/20 focus:outline-none"
                  >
                    <option value="">Select Courier</option>
                    {COURIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking ID..."
                    className="w-full px-3 py-2 bg-[#06191B] rounded-xl text-xs text-offwhite border border-champagne/20 font-mono focus:outline-none"
                  />
                </div>
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
