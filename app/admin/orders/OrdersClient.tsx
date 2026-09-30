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
  CheckCircle2,
  Send,
  Loader2,
  CheckSquare,
  Square,
  ArrowUpRight,
  ShieldCheck,
  Trash2,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { DeleteOrderModal } from '@/components/admin/DeleteOrderModal';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminBulkActionBar } from '@/components/admin/ui/AdminBulkActionBar';
import {
  BulkConfirmModal,
  BulkShipmentModal,
  BulkStatusModal,
  BulkResultModal,
  BulkResultItem,
  BulkSummary,
} from '@/components/admin/BulkOperationsModals';

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

export function OrdersClient({
  initialOrders,
  initialSearch = '',
  initialStatus = 'ALL',
}: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'ALL');
  const [actionQueueFilter, setActionQueueFilter] = useState<
    'ALL' | 'CONFIRMATION_PENDING' | 'TRACKING_PENDING' | 'DELIVERED_PENDING' | 'LABELS_READY'
  >('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);

  // In-flight single-order mutation tracking
  const [confirmingOrderIds, setConfirmingOrderIds] = useState<Set<string>>(new Set());
  const [sendingWhatsAppIds, setSendingWhatsAppIds] = useState<Set<string>>(new Set());

  // Bulk Operations State
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProcessingLabel, setBulkProcessingLabel] = useState('Processing...');
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [showBulkShipmentModal, setShowBulkShipmentModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkResultModal, setBulkResultModal] = useState<{
    title: string;
    summary: BulkSummary;
    results: BulkResultItem[];
  } | null>(null);

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

  // Compute live action queue summary counts
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

  // Reset page to 1 when filters or search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, actionQueueFilter]);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const query = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      o.orderNumber.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerPhone.includes(query) ||
      o.shippingCity.toLowerCase().includes(query) ||
      (resolveTracking(o)?.toLowerCase() || '').includes(query);

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

  // Paginated slice
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  // ─────────────────────────────────────────────────────────────────────────────
  // Single Order Operations
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Bulk Actions Orchestration
  // ─────────────────────────────────────────────────────────────────────────────
  const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));

  // 1. Bulk Confirm Execution
  const executeBulkConfirm = async () => {
    setShowBulkConfirmModal(false);
    setIsBulkProcessing(true);
    setBulkProcessingLabel('Confirming orders with backend validation...');

    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM',
          orderIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Bulk confirmation failed.');
      } else {
        const confirmedIds = new Set(
          (data.results || [])
            .filter((r: any) => r.success && !r.skipped)
            .map((r: any) => r.orderId)
        );

        const now = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            confirmedIds.has(o.id)
              ? {
                  ...o,
                  status: 'CONFIRMED',
                  confirmedAt: now,
                  confirmedBy: 'Admin',
                }
              : o
          )
        );

        setSelectedIds([]);
        setBulkResultModal({
          title: 'Bulk Order Confirmation Results',
          summary: data.summary,
          results: data.results,
        });
      }
    } catch {
      alert('Network error during bulk confirmation.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 2. Bulk Send WhatsApp Execution
  const executeBulkSendWhatsApp = async () => {
    if (selectedIds.length === 0 || isBulkProcessing) return;
    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Sending WhatsApp messages to ${selectedIds.length} customers...`);

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

        setSelectedIds((prev) => prev.filter((id) => !sentIds.has(id)));

        setBulkResultModal({
          title: 'Bulk WhatsApp Dispatch Results',
          summary: {
            total: selectedIds.length,
            successful: data.sent || 0,
            skipped: 0,
            failed: data.failed || 0,
          },
          results: (data.results || []).map((r: any) => ({
            orderId: r.orderId,
            orderNumber: r.orderNumber,
            success: r.success,
            action: r.action || 'WHATSAPP',
            message: r.error || (r.success ? 'Message delivered successfully' : 'Failed'),
          })),
        });
      }
    } catch {
      alert('Network error executing bulk WhatsApp dispatch.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 3. Bulk Create PostEx Shipments Execution
  const executeBulkCreatePostEx = async () => {
    setShowBulkShipmentModal(false);
    setIsBulkProcessing(true);
    setBulkProcessingLabel('Creating official PostEx shipments with courier API...');

    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SHIPMENT',
          orderIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Bulk shipment creation failed.');
      } else {
        const trackedMap = new Map<string, string>();
        (data.results || []).forEach((r: any) => {
          if (r.trackingNumber) {
            trackedMap.set(r.orderId, r.trackingNumber);
          }
        });

        setOrders((prev) =>
          prev.map((o) => {
            const tracking = trackedMap.get(o.id);
            if (!tracking) return o;
            return {
              ...o,
              trackingNumber: tracking,
              courier: 'POSTEX',
              status: o.status === 'CONFIRMED' ? 'PACKING' : o.status,
            };
          })
        );

        setSelectedIds([]);
        setBulkResultModal({
          title: 'Bulk PostEx Booking Results',
          summary: data.summary,
          results: data.results,
        });
      }
    } catch {
      alert('Network error during bulk shipment creation.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 4. Bulk Print Labels
  const handleBulkPrintLabels = () => {
    if (selectedIds.length === 0) return;
    const trackingList = selectedOrders
      .map((o) => resolveTracking(o))
      .filter((t): t is string => Boolean(t));

    if (trackingList.length === 0) {
      alert('None of the selected orders have an active PostEx tracking number.');
      return;
    }

    const url = `/api/admin/courier/postex/label?trackingNumbers=${encodeURIComponent(
      trackingList.join(',')
    )}`;
    window.open(url, '_blank');
  };

  // 5. Bulk Download Invoices
  const handleBulkDownloadInvoices = () => {
    if (selectedIds.length === 0) return;
    // Sequential trigger for invoice windows
    selectedOrders.slice(0, 10).forEach((order) => {
      window.open(`/admin/orders/${order.id}/invoice`, '_blank');
    });
    if (selectedOrders.length > 10) {
      alert('Opened invoices for the first 10 selected orders (browser pop-up protection).');
    }
  };

  // 6. Bulk Update Status Execution
  const executeBulkUpdateStatus = async (targetStatus: string) => {
    setShowBulkStatusModal(false);
    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Updating status to ${targetStatus}...`);

    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          orderIds: selectedIds,
          targetStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Bulk status update failed.');
      } else {
        const updatedIds = new Set(
          (data.results || [])
            .filter((r: any) => r.success && !r.skipped)
            .map((r: any) => r.orderId)
        );

        setOrders((prev) =>
          prev.map((o) =>
            updatedIds.has(o.id)
              ? {
                  ...o,
                  status: targetStatus,
                }
              : o
          )
        );

        setSelectedIds([]);
        setBulkResultModal({
          title: 'Bulk Status Update Results',
          summary: data.summary,
          results: data.results,
        });
      }
    } catch {
      alert('Network error updating status in bulk.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 7. Bulk Delete Execution
  const executeBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} orders? This will reverse inventory where applicable.`
      )
    ) {
      return;
    }

    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Deleting ${selectedIds.length} orders...`);

    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          orderIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Bulk deletion failed.');
      } else {
        const deletedIds = new Set(
          (data.results || [])
            .filter((r: any) => r.success)
            .map((r: any) => r.orderId)
        );

        setOrders((prev) => prev.filter((o) => !deletedIds.has(o.id)));
        setSelectedIds([]);
        setBulkResultModal({
          title: 'Bulk Order Deletion Results',
          summary: data.summary,
          results: data.results,
        });
      }
    } catch {
      alert('Network error deleting orders in bulk.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'City',
      'Total Amount',
      'Status',
      'Courier',
      'Tracking',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.shippingCity}"`,
      o.totalAmount,
      o.status,
      o.courier || '',
      resolveTracking(o) || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `wearomnia_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Eligibility evaluation for Bulk Modals
  const eligibleForConfirm = selectedOrders.filter(
    (o) =>
      o.status === 'PENDING' &&
      (!o.isPreOrder || o.preOrderPaymentStatus === 'PAYMENT_APPROVED')
  ).length;
  const skippedForConfirm = selectedOrders.length - eligibleForConfirm;
  const skippedConfirmReasons = selectedOrders
    .filter(
      (o) =>
        o.status !== 'PENDING' ||
        (o.isPreOrder && o.preOrderPaymentStatus !== 'PAYMENT_APPROVED')
    )
    .map((o) =>
      o.status === 'CONFIRMED'
        ? `#${o.orderNumber}: Already confirmed`
        : o.isPreOrder && o.preOrderPaymentStatus !== 'PAYMENT_APPROVED'
        ? `#${o.orderNumber}: Pre-order payment proof awaiting approval`
        : `#${o.orderNumber}: In ${o.status} state`
    );

  const eligibleForShipment = selectedOrders.filter(
    (o) =>
      (o.status === 'CONFIRMED' || o.status === 'PACKING') &&
      !resolveTracking(o) &&
      (!o.isPreOrder || o.preOrderPaymentStatus === 'PAYMENT_APPROVED')
  ).length;
  const alreadyTrackedShipments = selectedOrders.filter((o) =>
    Boolean(resolveTracking(o))
  ).length;

  return (
    <div className="space-y-6 text-[#FAF8F5] font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. ACTION REQUIRED SUMMARY CARDS (Standardized Spacing & Padding)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Confirmation WhatsApp */}
        <button
          onClick={() =>
            setActionQueueFilter(
              actionQueueFilter === 'CONFIRMATION_PENDING' ? 'ALL' : 'CONFIRMATION_PENDING'
            )
          }
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            actionQueueFilter === 'CONFIRMATION_PENDING'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/15'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#0A2528]/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-2">
            <span>Confirmation WhatsApp</span>
            <div className="w-7 h-7 rounded-lg bg-[#06191B] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {confirmationPendingCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1 truncate">
            Confirmed orders awaiting message
          </p>
        </button>

        {/* Card 2: Tracking WhatsApp */}
        <button
          onClick={() =>
            setActionQueueFilter(
              actionQueueFilter === 'TRACKING_PENDING' ? 'ALL' : 'TRACKING_PENDING'
            )
          }
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            actionQueueFilter === 'TRACKING_PENDING'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/15'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#0A2528]/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-400 font-bold uppercase tracking-wider mb-2">
            <span>Tracking WhatsApp</span>
            <div className="w-7 h-7 rounded-lg bg-[#06191B] text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {trackingPendingCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1 truncate">
            Dispatched orders awaiting tracking
          </p>
        </button>

        {/* Card 3: Delivered WhatsApp */}
        <button
          onClick={() =>
            setActionQueueFilter(
              actionQueueFilter === 'DELIVERED_PENDING' ? 'ALL' : 'DELIVERED_PENDING'
            )
          }
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            actionQueueFilter === 'DELIVERED_PENDING'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/15'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#0A2528]/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2">
            <span>Delivered WhatsApp</span>
            <div className="w-7 h-7 rounded-lg bg-[#06191B] text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {deliveredPendingCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1 truncate">
            Delivered orders awaiting review ask
          </p>
        </button>

        {/* Card 4: Labels Ready */}
        <button
          onClick={() =>
            setActionQueueFilter(
              actionQueueFilter === 'LABELS_READY' ? 'ALL' : 'LABELS_READY'
            )
          }
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            actionQueueFilter === 'LABELS_READY'
              ? 'bg-[#103A3E] border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/15'
              : 'bg-[#0A2528] border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#0A2528]/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold uppercase tracking-wider mb-2">
            <span>Labels Ready</span>
            <div className="w-7 h-7 rounded-lg bg-[#06191B] text-amber-300 border border-amber-300/30 flex items-center justify-center shrink-0">
              <Printer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black text-[#FAF8F5]">
            {labelsReadyCount}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/60 mt-1 truncate">
            Orders with official PostEx AWB
          </p>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. STANDARDIZED PAGE HEADER & EXPORT ACTION
      ───────────────────────────────────────────────────────────────────────────── */}
      <AdminPageHeader
        badge="Lifecycle Operating System"
        title={`Orders & Shipments (${filteredOrders.length})`}
        description="State-driven lifecycle queue with manual confirmation, sequential WhatsApp automation, and bulk courier operations."
        actions={
          <AdminButton
            size="md"
            variant="primary"
            onClick={exportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </AdminButton>
        }
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. SEARCH & STATUS FILTERS ROW (Consistent 40px Height)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#0A2528] p-3.5 sm:p-4 rounded-2xl border border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Order #, phone, name, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 border border-[#D4AF37]/25 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto h-10 px-4 bg-[#06191B] rounded-xl text-xs text-[#D4AF37] border border-[#D4AF37]/30 focus:outline-none font-bold uppercase tracking-wider cursor-pointer"
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
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. ORDERS TABLE (Desktop/Tablet) + MOBILE CARDS (Mobile)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 overflow-hidden shadow-xl">
        {filteredOrders.length === 0 ? (
          <div className="p-8">
            <AdminEmptyState
              title="No Orders Found"
              description="No orders matched the current search or lifecycle filter criteria."
              icon={FileText}
              action={
                search || statusFilter !== 'ALL' || actionQueueFilter !== 'ALL' ? (
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setActionQueueFilter('ALL');
                    }}
                  >
                    Reset Filters
                  </AdminButton>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#06191B]/80 text-[#D4AF37] font-mono text-[10px] uppercase tracking-wider border-b border-[#D4AF37]/20">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <button
                        onClick={toggleSelectAll}
                        className="cursor-pointer text-[#D4AF37]"
                        title="Select / Deselect all"
                      >
                        {selectedIds.length === filteredOrders.length &&
                        filteredOrders.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#D4AF37]/60" />
                        )}
                      </button>
                    </th>
                    <th className="p-3.5 w-36">Order #</th>
                    <th className="p-3.5 w-24">Date</th>
                    <th className="p-3.5 min-w-[160px]">Customer</th>
                    <th className="p-3.5 w-28">City</th>
                    <th className="p-3.5 w-32">Total &amp; Financials</th>
                    <th className="p-3.5 w-36">Order Status</th>
                    <th className="p-3.5 w-36">Tracking / Courier</th>
                    <th className="p-3.5 w-32">WhatsApp State</th>
                    <th className="p-3.5 w-36">Next Action</th>
                    <th className="p-3.5 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/10">
                  {paginatedOrders.map((order) => {
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
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="hover:underline flex items-center gap-1"
                            >
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
                          <span className="font-semibold text-[#FAF8F5] block truncate max-w-[150px]">
                            {order.customerName}
                          </span>
                          <span className="text-[#FAF8F5]/60 text-[11px] font-mono block">
                            {order.customerPhone}
                          </span>
                        </td>

                        {/* City */}
                        <td className="p-3.5 text-[#FAF8F5]/80 whitespace-nowrap">
                          {order.shippingCity}
                        </td>

                        {/* Total */}
                        <td className="p-3.5 font-mono font-bold text-[#D4AF37] whitespace-nowrap">
                          <div>Rs. {order.totalAmount.toLocaleString()}</div>
                          {order.isPreOrder && (
                            <div className="text-[10px] font-sans font-medium text-emerald-400 mt-0.5">
                              50% Adv: Rs. {(order.preOrderAdvanceAmount || 0).toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <OrderStatusBadge status={order.status} />
                            {order.isPreOrder && (
                              <div>
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
                          </div>
                        </td>

                        {/* Tracking / Courier */}
                        <td className="p-3.5 font-mono">
                          {tracking ? (
                            <div className="space-y-0.5">
                              <span className="text-emerald-400 font-bold block truncate max-w-[130px]">
                                {tracking}
                              </span>
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
                            {(order.status === 'DELIVERED' ||
                              order.shipments?.some((s) => s.status === 'DELIVERED')) && (
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
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-900 transition-colors"
                            >
                              Review Proof
                            </Link>
                          ) : nextAction === 'CONFIRM_ORDER' ? (
                            <AdminButton
                              size="sm"
                              variant="primary"
                              onClick={() => handleConfirmOrder(order.id)}
                              isLoading={isConfirming}
                              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                            >
                              Confirm
                            </AdminButton>
                          ) : nextAction === 'SEND_CONFIRMATION' ? (
                            <AdminButton
                              size="sm"
                              variant="success"
                              onClick={() => handleSendSingleWhatsApp(order)}
                              isLoading={isSendingWa}
                              leftIcon={<Send className="w-3.5 h-3.5" />}
                            >
                              Send Conf
                            </AdminButton>
                          ) : nextAction === 'SEND_TRACKING' ? (
                            <AdminButton
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSendSingleWhatsApp(order)}
                              isLoading={isSendingWa}
                              leftIcon={<Truck className="w-3.5 h-3.5 text-sky-400" />}
                            >
                              Send Track
                            </AdminButton>
                          ) : nextAction === 'SEND_DELIVERED' ? (
                            <AdminButton
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSendSingleWhatsApp(order)}
                              isLoading={isSendingWa}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            >
                              Send Deliv
                            </AdminButton>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> All Sent
                            </span>
                          )}
                        </td>

                        {/* Action Menu (Uniform 32px Height Group) */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="w-8 h-8 rounded-lg bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center justify-center border border-[#D4AF37]/20"
                              title="View Order Details"
                              aria-label="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {tracking && (
                              <a
                                href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(
                                  tracking
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-lg bg-[#D4AF37] text-black hover:bg-white transition-colors flex items-center justify-center shadow-xs"
                                title="Print Official PostEx AWB Label"
                                aria-label="Print Label"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => setSelectedOrderForDelete(order)}
                              className="w-8 h-8 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-colors flex items-center justify-center cursor-pointer"
                              title="Delete Order"
                              aria-label="Delete Order"
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

            {/* Mobile Cards View (< 768px Viewport) */}
            <div className="block md:hidden divide-y divide-[#D4AF37]/15">
              {paginatedOrders.map((order) => {
                const tracking = resolveTracking(order);
                const nextAction = getNextLifecycleAction(order);
                const isSelected = selectedIds.includes(order.id);
                const isConfirming = confirmingOrderIds.has(order.id);
                const isSendingWa = sendingWhatsAppIds.has(order.id);

                return (
                  <div
                    key={order.id}
                    className={`p-4 space-y-3 ${isSelected ? 'bg-[#103A3E]/40' : ''}`}
                  >
                    {/* Top Row: Checkbox, Order #, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleSelectOne(order.id)}
                          className="text-[#D4AF37] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#D4AF37]/50" />
                          )}
                        </button>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-[#D4AF37] text-sm hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        {order.isPreOrder && (
                          <span className="bg-amber-400 text-teal-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            PRE-ORDER
                          </span>
                        )}
                      </div>

                      <OrderStatusBadge status={order.status} />
                    </div>

                    {/* Middle Row: Customer Info & Financials */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#FAF8F5]/60 text-[10px] uppercase font-bold block">
                          Customer
                        </span>
                        <span className="font-semibold text-[#FAF8F5] block truncate">
                          {order.customerName}
                        </span>
                        <span className="font-mono text-[#FAF8F5]/60 text-[11px]">
                          {order.customerPhone}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[#FAF8F5]/60 text-[10px] uppercase font-bold block">
                          Total Amount
                        </span>
                        <span className="font-mono font-bold text-[#D4AF37] text-sm">
                          Rs. {order.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-[#FAF8F5]/60 text-[11px] block">
                          {order.shippingCity}
                        </span>
                      </div>
                    </div>

                    {/* Tracking Row if Booked */}
                    {tracking && (
                      <div className="p-2 rounded-lg bg-[#06191B] border border-[#D4AF37]/20 flex items-center justify-between text-xs">
                        <span className="text-[#FAF8F5]/60 font-mono text-[11px]">PostEx AWB:</span>
                        <span className="font-mono font-bold text-emerald-400">{tracking}</span>
                      </div>
                    )}

                    {/* Bottom Row: Next Lifecycle Action + Icon Controls */}
                    <div className="pt-2 border-t border-[#D4AF37]/10 flex items-center justify-between gap-2">
                      <div>
                        {nextAction === 'VERIFY_PAYMENT' ? (
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[10px] font-bold uppercase tracking-wider"
                          >
                            Review Proof
                          </Link>
                        ) : nextAction === 'CONFIRM_ORDER' ? (
                          <AdminButton
                            size="sm"
                            variant="primary"
                            onClick={() => handleConfirmOrder(order.id)}
                            isLoading={isConfirming}
                          >
                            Confirm Order
                          </AdminButton>
                        ) : nextAction === 'SEND_CONFIRMATION' ? (
                          <AdminButton
                            size="sm"
                            variant="success"
                            onClick={() => handleSendSingleWhatsApp(order)}
                            isLoading={isSendingWa}
                          >
                            Send WhatsApp Conf
                          </AdminButton>
                        ) : nextAction === 'SEND_TRACKING' ? (
                          <AdminButton
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSendSingleWhatsApp(order)}
                            isLoading={isSendingWa}
                          >
                            Send Tracking
                          </AdminButton>
                        ) : (
                          <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All Lifecycle Complete
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="w-8 h-8 rounded-lg bg-[#103A3E] text-[#D4AF37] flex items-center justify-center"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {tracking && (
                          <a
                            href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(
                              tracking
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-lg bg-[#D4AF37] text-black flex items-center justify-center"
                            title="Label"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedOrderForDelete(order)}
                          className="w-8 h-8 rounded-lg bg-rose-950/60 text-rose-300 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {filteredOrders.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            itemsPerPage={pageSize}
            onPageChange={(page: number) => setCurrentPage(page)}
            onItemsPerPageChange={(newSize: number) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. STICKY BULK ACTIONS BAR (Section 13)
      ───────────────────────────────────────────────────────────────────────────── */}
      <AdminBulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredOrders.length}
        onClearSelection={() => setSelectedIds([])}
        onConfirmOrders={() => setShowBulkConfirmModal(true)}
        onSendWhatsApp={executeBulkSendWhatsApp}
        onCreatePostEx={() => setShowBulkShipmentModal(true)}
        onPrintLabels={handleBulkPrintLabels}
        onDownloadInvoices={handleBulkDownloadInvoices}
        onUpdateStatus={() => setShowBulkStatusModal(true)}
        onDeleteOrders={executeBulkDelete}
        isProcessing={isBulkProcessing}
        processingLabel={bulkProcessingLabel}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. BULK ACTION CONFIRMATION & RESULT MODALS
      ───────────────────────────────────────────────────────────────────────────── */}
      {/* 1. Bulk Confirm Confirmation Modal */}
      <BulkConfirmModal
        isOpen={showBulkConfirmModal}
        onClose={() => setShowBulkConfirmModal(false)}
        onConfirm={executeBulkConfirm}
        eligibleCount={eligibleForConfirm}
        skippedCount={skippedForConfirm}
        skippedReasons={skippedConfirmReasons}
        isProcessing={isBulkProcessing}
      />

      {/* 2. Bulk Create PostEx Shipments Modal */}
      <BulkShipmentModal
        isOpen={showBulkShipmentModal}
        onClose={() => setShowBulkShipmentModal(false)}
        onConfirm={executeBulkCreatePostEx}
        eligibleCount={eligibleForShipment}
        alreadyTrackedCount={alreadyTrackedShipments}
        isProcessing={isBulkProcessing}
      />

      {/* 3. Bulk Update Status Modal */}
      <BulkStatusModal
        isOpen={showBulkStatusModal}
        onClose={() => setShowBulkStatusModal(false)}
        onConfirm={executeBulkUpdateStatus}
        selectedCount={selectedIds.length}
        isProcessing={isBulkProcessing}
      />

      {/* 4. Bulk Result Summary Modal */}
      {bulkResultModal && (
        <BulkResultModal
          isOpen={Boolean(bulkResultModal)}
          onClose={() => setBulkResultModal(null)}
          title={bulkResultModal.title}
          summary={bulkResultModal.summary}
          results={bulkResultModal.results}
        />
      )}

      {/* 5. Delete Order Confirmation Modal */}
      <DeleteOrderModal
        isOpen={Boolean(selectedOrderForDelete)}
        onClose={() => setSelectedOrderForDelete(null)}
        onConfirm={handleDeleteOrder}
        order={selectedOrderForDelete}
      />
    </div>
  );
}
