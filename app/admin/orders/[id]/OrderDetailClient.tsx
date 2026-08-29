'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  Printer,
  FileText,
  MessageSquare,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Crown,
  Send,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getValidNextStatuses, STATUS_LABELS } from '@/lib/order-status';
import { normalizePhone } from '@/lib/phone';
import { DeleteOrderModal } from '@/components/admin/DeleteOrderModal';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Customer notification state
  const [notifyingCustomer, setNotifyingCustomer] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState<{
    text: string;
    timestamp?: string;
    isError?: boolean;
    whatsappUrl?: string;
  } | null>(null);

  const handleDeleteOrder = async (reason: string) => {
    const res = await fetch('/api/admin/orders/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        reason,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete order.');
    }

    setShowDeleteModal(false);
    router.push('/admin/orders');
    router.refresh();
  };

  const activeShipment = order.shipments?.find(
    (s: any) =>
      !['FAILED', 'CANCELLED', 'ARCHIVED', 'Un-Assigned By Me', 'Expired'].includes(s.status) &&
      Boolean(s.trackingNumber)
  );
  const currentTracking = activeShipment?.trackingNumber || (order.courier ? order.trackingNumber : null);
  const isPostExActive = Boolean(currentTracking);

  const handleCreateShipment = async (providerName: string = 'POSTEX') => {
    if (isPostExActive) {
      setError(`PostEx shipment is already active (Tracking #: ${currentTracking}). Duplicate shipment blocked.`);
      return;
    }

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
    } catch {
      setError('Failed to create shipment. Network error.');
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleSendTrackingToCustomer = async () => {
    if (!currentTracking) return;
    setNotifyingCustomer(true);
    setNotificationFeedback(null);
    try {
      const res = await fetch('/api/admin/orders/notify-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: currentTracking,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotificationFeedback({ text: data.error || 'Failed to send tracking notification.', isError: true });
      } else {
        const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setNotificationFeedback({
          text: `✓ Tracking message sent (${timeStr})`,
          timestamp: data.timestamp,
          whatsappUrl: data.whatsappUrl,
        });
      }
    } catch {
      setNotificationFeedback({ text: 'Network error sending tracking notification.', isError: true });
    } finally {
      setNotifyingCustomer(false);
    }
  };

  const handleRefreshTracking = async () => {
    if (!currentTracking) return;
    setRefreshingTracking(true);
    setError('');
    setShipmentMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: currentTracking,
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
    } catch {
      setError('Network error refreshing tracking.');
    } finally {
      setRefreshingTracking(false);
    }
  };

  const handleCheckSettlement = async () => {
    if (!currentTracking) return;
    setCheckingSettlement(true);
    setError('');
    setShipmentMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          trackingNumber: currentTracking,
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
    } catch {
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
          trackingNumber: currentTracking,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to cancel PostEx shipment.');
      } else {
        setShipmentMessage('PostEx shipment cancelled successfully.');
        router.refresh();
      }
    } catch {
      setError('Network error cancelling shipment.');
    } finally {
      setCancellingShipment(false);
    }
  };

  const handleCopyTracking = () => {
    if (currentTracking && typeof window !== 'undefined') {
      navigator.clipboard.writeText(currentTracking);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const validNextStatuses = getValidNextStatuses(order.status);

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
          trackingNumber: currentTracking || undefined,
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
    } catch {
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
          trackingNumber: currentTracking || undefined,
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
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  // Operational Linear Timeline calculation
  const operationalSteps = [
    { key: 'PLACED', label: 'Order Placed', completed: true },
    {
      key: 'CONFIRMED',
      label: 'Confirmed',
      completed: ['CONFIRMED', 'PACKING', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      key: 'POSTEX_BOOKED',
      label: 'PostEx Booked',
      completed: Boolean(isPostExActive || ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)),
    },
    {
      key: 'TRACKING_ASSIGNED',
      label: 'Tracking Assigned',
      completed: Boolean(currentTracking),
    },
    {
      key: 'IN_TRANSIT',
      label: 'In Transit',
      completed: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      key: 'OUT_FOR_DELIVERY',
      label: 'Out For Delivery',
      completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      key: 'DELIVERED',
      label: order.status === 'RETURNED' ? 'Returned' : order.status === 'CANCELLED' ? 'Cancelled' : 'Delivered',
      completed: ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status),
      isTerminal: true,
    },
  ];

  return (
    <div className="space-y-6 text-[#FAF8F5] font-sans">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-[#D4AF37] hover:text-[#FAF8F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Orders
          </Link>
          <span className="text-[#D4AF37]/30">/</span>
          <span className="font-mono text-xs font-bold text-[#FAF8F5]">{order.orderNumber}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isPostExActive ? (
            <Link
              href={`/admin/orders/${order.id}/label`}
              target="_blank"
              className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" /> Print Official AWB
            </Link>
          ) : (
            <button
              onClick={() => handleCreateShipment('POSTEX')}
              disabled={creatingShipment || order.status === 'PENDING' || order.status === 'PLACED'}
              className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow disabled:opacity-40"
              title={order.status === 'PENDING' ? 'Confirm order first' : 'Book on PostEx'}
            >
              {creatingShipment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
              Send to PostEx
            </button>
          )}

          <Link
            href={`/admin/orders/${order.id}/invoice`}
            target="_blank"
            className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Invoice
          </Link>

          <button
            onClick={() => {
              const cleanPhone = normalizePhone(order.customerPhone);
              const msg = encodeURIComponent(`Hi ${order.customerName},\nRegarding your WearOMNIA order #${order.orderNumber}.`);
              window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
            }}
            className="bg-[#0A2528] hover:bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-950/60 hover:bg-red-900/90 text-red-300 border border-red-800/50 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
            title="Permanently Delete Order"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete Order
          </button>
        </div>
      </div>

      {/* Operational Linear Workflow Timeline */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3 mb-4">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4AF37]">
            Operational Fulfillment Pipeline
          </span>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Status: {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {operationalSteps.map((step, idx) => (
            <div
              key={step.key}
              className={`p-3 rounded-xl border text-center transition-all ${
                step.completed
                  ? 'bg-[#103A3E]/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#06191B]/60 border-[#D4AF37]/10 text-[#FAF8F5]/40'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#D4AF37]">
                Step {idx + 1}
              </div>
              <div className="text-xs font-bold mt-1 truncate">{step.label}</div>
              <div className="text-[9px] mt-1">
                {step.completed ? '✓ Done' : 'Pending'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback & Alert Banners */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 text-red-300 rounded-2xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-white/60 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {shipmentMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>{shipmentMessage}</span>
          </div>
          <button onClick={() => setShipmentMessage('')} className="text-white/60 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {notificationFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          notificationFeedback.isError
            ? 'bg-red-950/40 text-red-300 border-red-500/40'
            : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span className="font-semibold">{notificationFeedback.text}</span>
          </div>
          {notificationFeedback.whatsappUrl && (
            <a
              href={notificationFeedback.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
            >
              Open in WhatsApp Web →
            </a>
          )}
        </div>
      )}

      {/* Main Order Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Products & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Products Card */}
          <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
              <h2 className="font-serif text-base font-bold text-[#FAF8F5] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#D4AF37]" /> Ordered Items ({order.items.length})
              </h2>
              <span className="text-xs font-mono text-[#D4AF37]">
                Total: Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3.5 bg-[#06191B] rounded-xl border border-[#D4AF37]/10 text-xs"
                >
                  <div>
                    <h3 className="font-bold text-[#FAF8F5]">{item.productTitle}</h3>
                    <p className="text-[11px] text-[#FAF8F5]/60 mt-0.5">{item.variantInfo || 'Standard'}</p>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[#FAF8F5]/60">Rs. {item.unitPrice.toLocaleString()} × {item.quantity}</div>
                    <div className="font-bold text-[#D4AF37] text-sm">Rs. {item.subtotal.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Delivery Address Card */}
          <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-base font-bold text-[#FAF8F5] flex items-center gap-2 border-b border-[#D4AF37]/15 pb-3">
              <User className="w-4 h-4 text-[#D4AF37]" /> Customer & Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37]/70 block">Customer Name</span>
                <span className="font-semibold text-sm text-[#FAF8F5]">{order.customerName}</span>
              </div>
              <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37]/70 block">Phone / WhatsApp</span>
                <span className="font-mono font-semibold text-sm text-[#FAF8F5]">{order.customerPhone}</span>
              </div>
              <div className="sm:col-span-2 bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37]/70 block">Delivery Address</span>
                <p className="text-[#FAF8F5] font-medium leading-relaxed">{order.shippingAddress}</p>
                <p className="text-xs text-[#D4AF37] font-semibold uppercase">
                  {order.shippingCity}, {order.shippingProvince} {order.postalCode || ''}
                </p>
              </div>
            </div>

            {order.orderNotes && (
              <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-200">
                <span className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Customer Order Note:</span>
                {order.orderNotes}
              </div>
            )}
          </div>

          {/* Internal Notes & Save */}
          <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-3">
            <h2 className="font-serif text-base font-bold text-[#FAF8F5] flex items-center gap-2 border-b border-[#D4AF37]/15 pb-3">
              <FileText className="w-4 h-4 text-[#D4AF37]" /> Internal Operations Notes
            </h2>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add internal fulfillment or customer service notes here..."
              className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl p-3.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#FAF8F5]/50">
                {saveSuccess ? '✓ Note saved successfully.' : 'Internal only (not visible to customer)'}
              </span>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PostEx Shipment Tower & Status Control */}
        <div className="space-y-6">
          {/* PostEx Shipment Control Card */}
          <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
              <h2 className="font-serif text-base font-bold text-[#FAF8F5] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D4AF37]" /> PostEx Logistics Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                {isPostExActive ? 'Active' : 'Unbooked'}
              </span>
            </div>

            {isPostExActive ? (
              <div className="space-y-4">
                <div className="bg-[#06191B] border border-[#D4AF37]/20 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37]/80">Tracking Number</span>
                    <button
                      onClick={handleCopyTracking}
                      className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-sans"
                    >
                      <Copy className="w-3 h-3" /> {copySuccess ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-[#FAF8F5] tracking-wider break-all">
                    {currentTracking}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D4AF37]/10 text-xs">
                    <div>
                      <span className="text-[10px] text-[#FAF8F5]/50 block">COD Collectable:</span>
                      <span className="font-mono font-bold text-emerald-400">Rs. {order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#FAF8F5]/50 block">Settlement Status:</span>
                      <span className="font-semibold text-amber-300 uppercase">{settlementDetails?.settlementStatus || activeShipment?.settlementStatus || 'Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleSendTrackingToCustomer}
                    disabled={notifyingCustomer}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
                  >
                    {notifyingCustomer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Tracking to Customer
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/admin/orders/${order.id}/label`}
                      target="_blank"
                      className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black font-bold py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 shadow"
                    >
                      <Printer className="w-3 h-3" /> Official AWB
                    </Link>

                    <button
                      onClick={handleRefreshTracking}
                      disabled={refreshingTracking}
                      className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {refreshingTracking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Sync Status
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCheckSettlement}
                      disabled={checkingSettlement}
                      className="bg-[#06191B] hover:bg-[#103A3E] text-[#FAF8F5]/80 border border-[#D4AF37]/20 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {checkingSettlement ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                      Reconcile CPR
                    </button>

                    <a
                      href={`https://postex.pk/tracking?trackingNumber=${encodeURIComponent(currentTracking)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#06191B] hover:bg-[#103A3E] text-[#FAF8F5]/80 border border-[#D4AF37]/20 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> PostEx Portal
                    </a>
                  </div>

                  {activeShipment?.status !== 'CANCELLED' && activeShipment?.status !== 'Delivered' && (
                    <button
                      onClick={handleCancelPostExShipment}
                      disabled={cancellingShipment}
                      className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {cancellingShipment ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel PostEx Shipment'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/15">
                <p className="text-xs text-[#FAF8F5]/70 leading-relaxed">
                  {order.status === 'PENDING' || order.status === 'PLACED'
                    ? 'Confirm order first to unlock 1-click PostEx dispatch.'
                    : 'Order confirmed and ready for courier booking.'}
                </p>

                {(order.status === 'PENDING' || order.status === 'PLACED') ? (
                  <button
                    onClick={() => handleStatusChange('CONFIRMED')}
                    disabled={statusSaving}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {statusSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Confirm Order
                  </button>
                ) : (
                  <button
                    onClick={() => handleCreateShipment('POSTEX')}
                    disabled={creatingShipment}
                    className="w-full bg-[#D4AF37] hover:bg-[#FAF8F5] text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingShipment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                    Send to PostEx
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Payment & Order Summary */}
          <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-3">
            <h2 className="font-serif text-base font-bold text-[#FAF8F5] flex items-center gap-2 border-b border-[#D4AF37]/15 pb-3">
              <CreditCard className="w-4 h-4 text-[#D4AF37]" /> Payment Summary
            </h2>
            <div className="space-y-2 text-xs text-[#FAF8F5]/80">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#D4AF37]">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}:</span>
                  <span>- Rs. {order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee:</span>
                <span>{order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#D4AF37] pt-2 border-t border-[#D4AF37]/20 font-mono">
                <span>COD Total:</span>
                <span>Rs. {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone: Permanent Order Deletion */}
          <div className="bg-[#0A2528] border border-red-500/30 rounded-2xl p-6 space-y-3">
            <h2 className="font-serif text-base font-bold text-red-400 flex items-center gap-2 border-b border-red-500/20 pb-3">
              <Trash2 className="w-4 h-4 text-red-400" /> Danger Zone
            </h2>
            <p className="text-xs text-[#FAF8F5]/70 leading-relaxed">
              Permanently remove this order from all business analytics, reports, revenue, and order lists. Customer profile will remain intact.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-600/90 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Order Permanently
            </button>
          </div>
        </div>
      </div>

      <DeleteOrderModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOrder}
        order={order}
      />
    </div>
  );
}
