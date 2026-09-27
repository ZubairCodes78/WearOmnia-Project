'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Printer,
  Download,
  Eye,
  FileText,
  Truck,
  Package,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { normalizePhone } from '@/lib/phone';
import { DeleteOrderModal } from '@/components/admin/DeleteOrderModal';

interface OrderItem {
  id: string;
  productTitle: string;
  variantInfo: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: string;
  trackingNumber: string | null;
  courier: string | null;
  couponCode: string | null;
  amountPaid?: number;
  isPreOrder?: boolean | null;
  preOrderAdvancePercent?: number | null;
  preOrderAdvanceAmount?: number | null;
  preOrderRemainingAmount?: number | null;
  preOrderPaymentStatus?: string | null;
  preOrderPaymentMethodName?: string | null;
  preOrderPaymentScreenshotUrl?: string | null;
  confirmedAt?: string | Date | null;
  confirmedBy?: string | null;
  confirmationWhatsAppSentAt?: string | Date | null;
  confirmationWhatsAppMessageId?: string | null;
  trackingWhatsAppSentAt?: string | Date | null;
  trackingWhatsAppMessageId?: string | null;
  deliveredWhatsAppSentAt?: string | Date | null;
  deliveredWhatsAppMessageId?: string | null;
  deliveredAt?: string | Date | null;
  createdAt: Date | string;
  items: OrderItem[];
  shipments?: Array<{
    id: string;
    trackingNumber: string | null;
    status: string;
    codAmount: number;
  }>;
}

interface OrdersClientProps {
  initialOrders: Order[];
  initialSearch?: string;
  initialStatus?: string;
}

export function OrdersClient({ initialOrders, initialSearch = '', initialStatus = 'ALL' }: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'ALL');
  const [actionQueueFilter, setActionQueueFilter] = useState<
    'ALL' | 'CONFIRMATION_PENDING' | 'TRACKING_PENDING' | 'DELIVERED_PENDING' | 'LABELS_READY'
  >('ALL');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);

  // In-flight mutation tracking for double-click protection
  const [confirmingOrderIds, setConfirmingOrderIds] = useState<Set<string>>(new Set());
  const [sendingWhatsAppIds, setSendingWhatsAppIds] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; sent: number; failed: number } | null>(null);
  const [bulkResultModal, setBulkResultModal] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);

  // Helper to resolve active tracking number
  const resolveTracking = (order: Order) =>
    order.trackingNumber ||
    order.shipments?.find((s) => s.status !== 'CANCELLED' && Boolean(s.trackingNumber))?.trackingNumber;

  // Helper to determine next lifecycle action for an order
  const getNextLifecycleAction = (
    order: Order
  ): 'SEND_CONFIRMATION' | 'SEND_TRACKING' | 'SEND_DELIVERED' | 'CONFIRM_ORDER' | 'VERIFY_PAYMENT' | 'NONE' => {
    if (order.isPreOrder && order.preOrderPaymentStatus !== 'PAYMENT_APPROVED') {
      return 'VERIFY_PAYMENT';
    }

    if (order.status === 'PENDING') {
      return 'CONFIRM_ORDER';
    }

    const tracking = resolveTracking(order);
    const isDelivered = order.status === 'DELIVERED' || order.shipments?.some((s) => s.status === 'DELIVERED');

    if (order.status === 'CONFIRMED' && !order.confirmationWhatsAppSentAt) {
      return 'SEND_CONFIRMATION';
    }

    if (
      (order.status === 'CONFIRMED' || order.status === 'PACKING' || order.status === 'DISPATCHED') &&
      Boolean(tracking) &&
      !order.trackingWhatsAppSentAt
    ) {
      return 'SEND_TRACKING';
    }

    if (isDelivered && !order.deliveredWhatsAppSentAt) {
      return 'SEND_DELIVERED';
    }

    return 'NONE';
  };

  // Real-Time SSE Stream for Instant Admin Order Updates
  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/admin/events/sse');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_ORDER' && data.order) {
            setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)]);
          } else if (data.type === 'STATUS_CHANGED' && data.order) {
            setOrders((prev) =>
              prev.map((o) => (o.id === data.order.id ? { ...o, ...data.order } : o))
            );
          } else if (data.type === 'ORDER_DELETED' && data.order) {
            setOrders((prev) => prev.filter((o) => o.id !== data.order.id));
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch {
      // Fallback
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Compute live action queue summary counts directly from order database state
  const confirmationPendingCount = orders.filter(
    (o) => o.status === 'CONFIRMED' && !o.confirmationWhatsAppSentAt
  ).length;

  const trackingPendingCount = orders.filter(
    (o) =>
      (o.status === 'CONFIRMED' || o.status === 'PACKING' || o.status === 'DISPATCHED') &&
      Boolean(resolveTracking(o)) &&
      !o.trackingWhatsAppSentAt
  ).length;

  const deliveredPendingCount = orders.filter(
    (o) =>
      (o.status === 'DELIVERED' || o.shipments?.some((s) => s.status === 'DELIVERED')) &&
      !o.deliveredWhatsAppSentAt
  ).length;

  const labelsReadyCount = orders.filter((o) => Boolean(resolveTracking(o))).length;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.shippingCity.toLowerCase().includes(search.toLowerCase()) ||
      (resolveTracking(o)?.toLowerCase() || '').includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'PRE_ORDER') {
      if (!o.isPreOrder) return false;
    } else if (statusFilter === 'PRE_ORDER_PENDING') {
      if (!o.isPreOrder || o.preOrderPaymentStatus === 'PAYMENT_APPROVED') return false;
    } else if (statusFilter !== 'ALL') {
      if (o.status !== statusFilter) return false;
    }

    // Action Queue filter
    const action = getNextLifecycleAction(o);
    if (actionQueueFilter === 'CONFIRMATION_PENDING') {
      return action === 'SEND_CONFIRMATION';
    }
    if (actionQueueFilter === 'TRACKING_PENDING') {
      return action === 'SEND_TRACKING';
    }
    if (actionQueueFilter === 'DELIVERED_PENDING') {
      return action === 'SEND_DELIVERED';
    }
    if (actionQueueFilter === 'LABELS_READY') {
      return Boolean(resolveTracking(o));
    }

    return true;
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1. Manual Order Confirmation Action (Requirement 5)
  const handleConfirmOrder = async (orderId: string) => {
    if (confirmingOrderIds.has(orderId)) return;
    setConfirmingOrderIds((prev) => new Set(prev).add(orderId));

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to confirm order.');
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'CONFIRMED',
                  confirmedAt: new Date().toISOString(),
                  confirmedBy: 'Admin',
                }
              : o
          )
        );
      }
    } catch {
      alert('Network error confirming order.');
    } finally {
      setConfirmingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  // 2. Single Order WhatsApp Lifecycle Action
  const handleSendSingleWhatsApp = async (order: Order) => {
    if (sendingWhatsAppIds.has(order.id)) return;
    setSendingWhatsAppIds((prev) => new Set(prev).add(order.id));

    try {
      const res = await fetch('/api/admin/orders/send-lifecycle-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [order.id] }),
      });
      const data = await res.json();
      if (!res.ok || data.failed > 0) {
        alert(data.results?.[0]?.error || data.error || 'Failed to send WhatsApp message.');
      } else {
        const actionSent = data.results?.[0]?.action;
        const now = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== order.id) return o;
            if (actionSent === 'CONFIRMATION') {
              return { ...o, confirmationWhatsAppSentAt: now };
            }
            if (actionSent === 'TRACKING') {
              return { ...o, trackingWhatsAppSentAt: now };
            }
            if (actionSent === 'DELIVERED') {
              return { ...o, deliveredWhatsAppSentAt: now };
            }
            return o;
          })
        );
      }
    } catch {
      alert('Network error sending WhatsApp message.');
    } finally {
      setSendingWhatsAppIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  // 3. Bulk Send to WhatsApp Action (Requirement 7 & 21)
  const handleBulkSendWhatsApp = async () => {
    if (selectedIds.length === 0 || isBulkSending) return;
    setIsBulkSending(true);
    setBulkProgress({ current: 0, total: selectedIds.length, sent: 0, failed: 0 });

    try {
      const res = await fetch('/api/admin/orders/send-lifecycle-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to execute bulk WhatsApp send.');
      } else {
        const sentIds = new Set(
          (data.results || [])
            .filter((r: any) => r.success)
            .map((r: any) => r.orderId)
        );

        const now = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) => {
            if (!sentIds.has(o.id)) return o;
            const resItem = data.results.find((r: any) => r.orderId === o.id);
            if (resItem?.action === 'CONFIRMATION') {
              return { ...o, confirmationWhatsAppSentAt: now };
            }
            if (resItem?.action === 'TRACKING') {
              return { ...o, trackingWhatsAppSentAt: now };
            }
            if (resItem?.action === 'DELIVERED') {
              return { ...o, deliveredWhatsAppSentAt: now };
            }
            return o;
          })
        );

        // Deselect successful orders; keep failed orders selected for quick retry
        setSelectedIds((prev) => prev.filter((id) => !sentIds.has(id)));

        const errors = (data.results || [])
          .filter((r: any) => !r.success)
          .map((r: any) => `#${r.orderNumber}: ${r.error || 'Failed'}`);

        setBulkResultModal({
          sent: data.sent || 0,
          failed: data.failed || 0,
          errors,
        });
      }
    } catch {
      alert('Network error executing bulk WhatsApp dispatch.');
    } finally {
      setIsBulkSending(false);
      setBulkProgress(null);
    }
  };

  // 4. Bulk Print Labels Action (Requirement 22)
  const handleBulkPrintLabels = () => {
    if (selectedIds.length === 0) return;
    const eligibleOrders = orders.filter((o) => selectedIds.includes(o.id));
    const trackingList = eligibleOrders
      .map((o) => resolveTracking(o))
      .filter((t): t is string => Boolean(t));

    if (trackingList.length === 0) {
      alert('None of the selected orders have an active PostEx tracking number.');
      return;
    }

    const url = `/api/admin/courier/postex/label?trackingNumbers=${encodeURIComponent(trackingList.join(','))}`;
    window.open(url, '_blank');
  };

  // Delete handler
  const handleDeleteOrder = async (reason: string) => {
    if (!selectedOrderForDelete) return;

    const res = await fetch('/api/admin/orders/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: selectedOrderForDelete.id,
        reason,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete order.');
    }

    setOrders((prev) => prev.filter((o) => o.id !== selectedOrderForDelete.id));
    setSelectedOrderForDelete(null);
    router.refresh();
  };

  const exportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'City', 'Total Amount', 'Status', 'Courier', 'Tracking'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      o.customerName,
      o.customerPhone,
      o.shippingCity,
      o.totalAmount,
      o.status,
      o.courier || '',
      resolveTracking(o) || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wearomnia_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-[#FAF8F5]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. ACTION REQUIRED SUMMARY CARDS (Requirement 29)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-sans">
        {/* Card 1: Confirmation WhatsApp */}
        <button
          onClick={() =>
            setActionQueueFilter(actionQueueFilter === 'CONFIRMATION_PENDING' ? 'ALL' : 'CONFIRMATION_PENDING')
          }
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            actionQueueFilter === 'CONFIRMATION_PENDING'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-2">
            <span>Confirmation WhatsApp</span>
            <Send className="w-3.5 h-3.5" />
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {confirmationPendingCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1">Confirmed orders awaiting message</p>
        </button>

        {/* Card 2: Tracking WhatsApp */}
        <button
          onClick={() =>
            setActionQueueFilter(actionQueueFilter === 'TRACKING_PENDING' ? 'ALL' : 'TRACKING_PENDING')
          }
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            actionQueueFilter === 'TRACKING_PENDING'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400 font-bold uppercase tracking-wider mb-2">
            <span>Tracking WhatsApp</span>
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {trackingPendingCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1">Dispatched orders awaiting tracking</p>
        </button>

        {/* Card 3: Delivered WhatsApp */}
        <button
          onClick={() =>
            setActionQueueFilter(actionQueueFilter === 'DELIVERED_PENDING' ? 'ALL' : 'DELIVERED_PENDING')
          }
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            actionQueueFilter === 'DELIVERED_PENDING'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">
            <span>Delivered WhatsApp</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {deliveredPendingCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1">Delivered orders awaiting review ask</p>
        </button>

        {/* Card 4: Labels Ready */}
        <button
          onClick={() =>
            setActionQueueFilter(actionQueueFilter === 'LABELS_READY' ? 'ALL' : 'LABELS_READY')
          }
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            actionQueueFilter === 'LABELS_READY'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold uppercase tracking-wider mb-2">
            <span>Labels Ready</span>
            <Printer className="w-3.5 h-3.5" />
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {labelsReadyCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1">Orders with official PostEx AWB</p>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. PAGE HEADER & SEARCH BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Lifecycle Operating System</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
            Orders &amp; Shipments ({filteredOrders.length})
          </h1>
          <p className="text-xs text-[#FAF8F5]/60 font-sans mt-0.5">
            State-driven lifecycle queue with manual confirmation, sequential WhatsApp automation, and bulk courier tools.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by Order #, phone, name, tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 border border-[#D4AF37]/25 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#06191B] rounded-xl text-xs text-[#D4AF37] border border-[#D4AF37]/30 focus:outline-none font-bold uppercase tracking-wider cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRE_ORDER">✨ Pre-Orders (All)</option>
            <option value="PRE_ORDER_PENDING">⏳ Pre-Order Review Pending</option>
            <option value="PENDING">Pending Confirmation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKING">Packing Parcel</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>

          <button
            onClick={exportCSV}
            className="w-full sm:w-auto bg-[#D4AF37] text-black px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. BULK SELECTION ACTION TOOLBAR (Requirement 7 & 21)
      ───────────────────────────────────────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="bg-[#103A3E] border border-[#D4AF37]/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-mono font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-[#FAF8F5] uppercase tracking-wider">
              Orders Selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-[#FAF8F5]/60 hover:text-[#FAF8F5] underline cursor-pointer ml-2"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleBulkSendWhatsApp}
              disabled={isBulkSending}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isBulkSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send To WhatsApp ({selectedIds.length})</span>
                </>
              )}
            </button>

            <button
              onClick={handleBulkPrintLabels}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-white text-black text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Labels</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. ORDERS TABLE (Requirement 4)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 overflow-hidden shadow-xl">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-900/60 text-[#D4AF37] flex items-center justify-center mx-auto border border-[#D4AF37]/30 shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">No Orders Found</h3>
            <p className="text-xs text-[#FAF8F5]/60 max-w-sm mx-auto font-sans">
              No orders matched the current search or lifecycle filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#06191B]/80 text-[#D4AF37] font-mono text-[10px] uppercase tracking-wider border-b border-[#D4AF37]/20">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="cursor-pointer text-[#D4AF37]"
                      title="Select / Deselect all"
                    >
                      {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#D4AF37]/60" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5">Total &amp; Financials</th>
                  <th className="p-3.5">Order Status</th>
                  <th className="p-3.5">Tracking / Courier</th>
                  <th className="p-3.5">WhatsApp State</th>
                  <th className="p-3.5">Next Action</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {filteredOrders.map((order) => {
                  const tracking = resolveTracking(order);
                  const nextAction = getNextLifecycleAction(order);
                  const isSelected = selectedIds.includes(order.id);
                  const isConfirming = confirmingOrderIds.has(order.id);
                  const isSendingWa = sendingWhatsAppIds.has(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-[#103A3E]/30 transition-colors ${
                        isSelected ? 'bg-[#103A3E]/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectOne(order.id)}
                          className="cursor-pointer text-[#D4AF37]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#D4AF37]/40" />
                          )}
                        </button>
                      </td>

                      {/* Order Number */}
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        <div className="flex flex-col gap-1 items-start">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline flex items-center gap-1">
                            {order.orderNumber}
                            <ArrowUpRight className="w-3 h-3 opacity-60" />
                          </Link>
                          {order.isPreOrder && (
                            <span className="bg-amber-400 text-teal-950 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase border border-amber-300">
                              PRE-ORDER
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-[#FAF8F5]/70 font-mono text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <span className="font-semibold text-[#FAF8F5] block">{order.customerName}</span>
                        <span className="text-[#FAF8F5]/60 text-[11px] font-mono">{order.customerPhone}</span>
                      </td>

                      {/* City */}
                      <td className="p-3.5 text-[#FAF8F5]/80">{order.shippingCity}</td>

                      {/* Total */}
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        <div>Rs. {order.totalAmount.toLocaleString()}</div>
                        {order.isPreOrder && (
                          <div className="text-[10px] font-sans font-medium text-emerald-400 mt-0.5">
                            50% Adv: Rs. {(order.preOrderAdvanceAmount || 0).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <OrderStatusBadge status={order.status} />
                        {order.isPreOrder && (
                          <div className="mt-1">
                            {order.preOrderPaymentStatus === 'PAYMENT_APPROVED' ? (
                              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block">
                                ✓ Proof Approved
                              </span>
                            ) : order.preOrderPaymentStatus === 'PAYMENT_REJECTED' ? (
                              <span className="bg-red-950/80 text-red-400 border border-red-700/50 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block">
                                ✕ Proof Rejected
                              </span>
                            ) : (
                              <span className="bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block animate-pulse">
                                ⏳ Verify Proof
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tracking / Courier */}
                      <td className="p-3.5 font-mono">
                        {tracking ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-400 font-bold block">{tracking}</span>
                            <span className="text-[9.5px] uppercase font-bold text-[#D4AF37]/80">
                              {order.courier || 'PostEx'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#FAF8F5]/30 text-[11px]">—</span>
                        )}
                      </td>

                      {/* WhatsApp State Column */}
                      <td className="p-3.5 font-mono text-[10px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[#FAF8F5]/50">Conf:</span>
                            {order.confirmationWhatsAppSentAt ? (
                              <span className="text-emerald-400 font-bold">✓ Sent</span>
                            ) : (
                              <span className="text-amber-400/80">Pending</span>
                            )}
                          </div>
                          {tracking && (
                            <div className="flex items-center gap-1">
                              <span className="text-[#FAF8F5]/50">Track:</span>
                              {order.trackingWhatsAppSentAt ? (
                                <span className="text-emerald-400 font-bold">✓ Sent</span>
                              ) : (
                                <span className="text-sky-400">Ready</span>
                              )}
                            </div>
                          )}
                          {(order.status === 'DELIVERED' || order.shipments?.some((s) => s.status === 'DELIVERED')) && (
                            <div className="flex items-center gap-1">
                              <span className="text-[#FAF8F5]/50">Deliv:</span>
                              {order.deliveredWhatsAppSentAt ? (
                                <span className="text-emerald-400 font-bold">✓ Sent</span>
                              ) : (
                                <span className="text-emerald-300">Ready</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Next Valid Action Column */}
                      <td className="p-3.5 whitespace-nowrap">
                        {nextAction === 'VERIFY_PAYMENT' ? (
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-900"
                          >
                            Review Proof
                          </Link>
                        ) : nextAction === 'CONFIRM_ORDER' ? (
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={isConfirming}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-wider hover:bg-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isConfirming ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                            Confirm Order
                          </button>
                        ) : nextAction === 'SEND_CONFIRMATION' ? (
                          <button
                            onClick={() => handleSendSingleWhatsApp(order)}
                            disabled={isSendingWa}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSendingWa ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Send Confirmation
                          </button>
                        ) : nextAction === 'SEND_TRACKING' ? (
                          <button
                            onClick={() => handleSendSingleWhatsApp(order)}
                            disabled={isSendingWa}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSendingWa ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                            Send Tracking
                          </button>
                        ) : nextAction === 'SEND_DELIVERED' ? (
                          <button
                            onClick={() => handleSendSingleWhatsApp(order)}
                            disabled={isSendingWa}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSendingWa ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Send Delivered
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> All Sent
                          </span>
                        )}
                      </td>

                      {/* Action Menu */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-1.5 rounded-lg bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {tracking && (
                            <a
                              href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(tracking)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-[#D4AF37] text-black hover:bg-white transition-colors"
                              title="Print Official PostEx AWB Label"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => setSelectedOrderForDelete(order)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Result Summary Modal */}
      {bulkResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-[#0A2528] rounded-2xl border border-[#D4AF37]/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#FAF8F5]">
              Bulk WhatsApp Results
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/50">
                <span className="font-mono text-2xl font-bold text-emerald-400">{bulkResultModal.sent}</span>
                <span className="block text-[11px] text-emerald-300 uppercase font-bold mt-1">Sent Successfully</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50">
                <span className="font-mono text-2xl font-bold text-rose-400">{bulkResultModal.failed}</span>
                <span className="block text-[11px] text-rose-300 uppercase font-bold mt-1">Failed</span>
              </div>
            </div>

            {bulkResultModal.errors.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-[#06191B] rounded-xl text-xs text-rose-300 font-mono">
                {bulkResultModal.errors.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <button
              onClick={() => setBulkResultModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteOrderModal
        isOpen={Boolean(selectedOrderForDelete)}
        onClose={() => setSelectedOrderForDelete(null)}
        onConfirm={handleDeleteOrder}
        order={selectedOrderForDelete}
      />
    </div>
  );
}
