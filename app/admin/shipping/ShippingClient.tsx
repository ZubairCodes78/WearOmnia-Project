'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Search,
  RefreshCw,
  Printer,
  FileText,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
  X,
  Copy,
  Check,
  Archive,
  Trash2,
  Building,
  ChevronRight,
  Package,
  Info,
  Phone,
  MapPin,
  HelpCircle,
  Activity,
  Banknote,
} from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';
import {
  getCanonicalCourierStatus,
  getCourierStatusBadgeInfo,
  getSettlementStatusBadgeInfo,
  isValidActiveShipment,
  isSettlementEligible,
  CanonicalCourierStatus,
} from '@/lib/courier/canonical-status';

interface ShipmentItem {
  id: string;
  orderId: string;
  provider: string;
  trackingNumber: string | null;
  orderRefNumber: string | null;
  status: string;
  codAmount: number;
  labelUrl: string | null;
  trackingUrl: string | null;
  settlementStatus: string | null;
  settlementDate: string | null;
  cprNumber: string | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  returnDate: string | null;
  returnReason: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    shippingCity: string;
    shippingAddress: string;
    totalAmount: number;
    status: string;
  };
}

interface ConfirmedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  totalAmount: number;
  createdAt: string;
}

interface ShippingClientProps {
  initialShipments: ShipmentItem[];
  siteSettings: SiteSettingsData;
  confirmedOrders: ConfirmedOrder[];
}

export function ShippingClient({ initialShipments, siteSettings, confirmedOrders }: ShippingClientProps) {
  const router = useRouter();
  const [shipments, setShipments] = useState<ShipmentItem[]>(initialShipments);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<
    'ALL' | 'READY_FOR_POSTEX' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNS' | 'CANCELLED_ARCHIVED'
  >('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Copy tracking feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Active Drawer States
  const [activeTracking, setActiveTracking] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [activeSettlement, setActiveSettlement] = useState<any | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  // WhatsApp Customer Notification State
  const [whatsappModal, setWhatsappModal] = useState<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    trackingNumber: string;
  } | null>(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappFeedback, setWhatsappFeedback] = useState<{
    text: string;
    isError?: boolean;
    timestamp?: string;
    whatsappUrl?: string;
  } | null>(null);

  // Archive & Delete Test Shipment Modals
  const [archiveModalShipment, setArchiveModalShipment] = useState<ShipmentItem | null>(null);
  const [deleteModalShipment, setDeleteModalShipment] = useState<ShipmentItem | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  // Action Banners & Dispatch Loading
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [globalBanner, setGlobalBanner] = useState<{ text: string; isError?: boolean } | null>(null);

  // Diagnostics state
  const [testingConnection, setTestingConnection] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    if (typeof window !== 'undefined' && text) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleTestDiagnostics = async () => {
    setTestingConnection(true);
    setDiagnosticResult(null);
    try {
      const res = await fetch('/api/admin/courier/postex/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setDiagnosticResult(data.message || (data.success ? 'PostEx API connected and authenticated successfully!' : 'PostEx API is not configured.'));
    } catch {
      setDiagnosticResult('PostEx connection error.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRefreshTracking = async (trackingNumber: string, orderId?: string) => {
    setTrackingLoading(true);
    setActiveTracking({ trackingNumber, loading: true });
    try {
      const res = await fetch('/api/admin/courier/postex/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, orderId }),
      });
      const data = await res.json();
      if (res.ok && data.tracking) {
        setActiveTracking(data.tracking);
        // Update local shipment state with canonical status
        const canonical = getCanonicalCourierStatus(data.tracking.rawStatus || data.tracking.status);
        setShipments((prev) =>
          prev.map((s) =>
            s.trackingNumber === trackingNumber
              ? {
                  ...s,
                  status: canonical === 'CANCELLED' ? 'CANCELLED' : data.tracking.rawStatus || data.tracking.status,
                }
              : s
          )
        );
      } else {
        setActiveTracking({ trackingNumber, error: data.error || 'Tracking details not found.' });
      }
    } catch {
      setActiveTracking({ trackingNumber, error: 'Network error checking tracking.' });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCheckSettlement = async (trackingNumber: string, orderId?: string) => {
    setSettlementLoading(true);
    setActiveSettlement({ trackingNumber, loading: true });
    try {
      const res = await fetch('/api/admin/courier/postex/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, orderId }),
      });
      const data = await res.json();
      if (res.ok && data.payment) {
        setActiveSettlement(data.payment);
        setShipments((prev) =>
          prev.map((s) =>
            s.trackingNumber === trackingNumber
              ? {
                  ...s,
                  settlementStatus: data.payment.settlementStatus,
                  settlementDate: data.payment.settlementDate,
                  cprNumber: data.payment.cprNumber_1 || data.payment.cprNumber,
                }
              : s
          )
        );
      } else {
        setActiveSettlement({ trackingNumber, error: data.error || 'Settlement information not available yet.' });
      }
    } catch {
      setActiveSettlement({ trackingNumber, error: 'Network error checking settlement.' });
    } finally {
      setSettlementLoading(false);
    }
  };

  const handleSendOrderToPostEx = async (orderId: string) => {
    setDispatchingId(orderId);
    setGlobalBanner(null);
    try {
      const res = await fetch('/api/admin/courier/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, providerName: 'POSTEX' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalBanner({ text: data.error || 'Failed to dispatch order to PostEx.', isError: true });
      } else {
        setGlobalBanner({ text: `✓ Shipment created on PostEx! Tracking ID: ${data.shipment?.trackingNumber}` });
        router.refresh();
      }
    } catch {
      setGlobalBanner({ text: 'Network error creating shipment.', isError: true });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleSendWhatsappTracking = async () => {
    if (!whatsappModal) return;
    setSendingWhatsapp(true);
    setWhatsappFeedback(null);
    try {
      const res = await fetch('/api/admin/orders/notify-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: whatsappModal.orderId,
          trackingNumber: whatsappModal.trackingNumber,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setWhatsappFeedback({
          text: `✓ Tracking message sent Today, ${timeStr}`,
          timestamp: new Date().toISOString(),
          whatsappUrl: data.whatsappUrl,
        });
      } else {
        setWhatsappFeedback({
          text: data.error || 'Tracking message could not be sent.',
          isError: true,
        });
      }
    } catch {
      setWhatsappFeedback({
        text: 'Network error sending tracking notification.',
        isError: true,
      });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleExecuteArchive = async () => {
    if (!archiveModalShipment) return;
    setActionProcessing(true);
    try {
      const res = await fetch('/api/admin/courier/shipments/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: archiveModalShipment.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setShipments((prev) =>
          prev.map((s) => (s.id === archiveModalShipment.id ? { ...s, status: 'ARCHIVED' } : s))
        );
        setGlobalBanner({ text: '✓ Shipment archived successfully.' });
        setArchiveModalShipment(null);
        router.refresh();
      } else {
        alert(data.error || 'Failed to archive shipment.');
      }
    } catch {
      alert('Network error archiving shipment.');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleExecuteDeleteTest = async () => {
    if (!deleteModalShipment) return;
    setActionProcessing(true);
    try {
      const res = await fetch('/api/admin/courier/shipments/delete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: deleteModalShipment.id,
          confirmation: 'CONFIRM_DELETE_RECORD',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShipments((prev) => prev.filter((s) => s.id !== deleteModalShipment.id));
        setGlobalBanner({ text: '✓ Test shipment record removed safely.' });
        setDeleteModalShipment(null);
        router.refresh();
      } else {
        alert(data.error || 'Failed to remove test shipment.');
      }
    } catch {
      alert('Network error removing test shipment.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Filter Shipments
  const filteredShipments = shipments.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (s.trackingNumber && s.trackingNumber.toLowerCase().includes(term)) ||
      (s.orderRefNumber && s.orderRefNumber.toLowerCase().includes(term)) ||
      (s.order?.customerName && s.order.customerName.toLowerCase().includes(term)) ||
      (s.order?.customerPhone && s.order.customerPhone.includes(term)) ||
      (s.order?.shippingCity && s.order.shippingCity.toLowerCase().includes(term)) ||
      (s.order?.orderNumber && s.order.orderNumber.toLowerCase().includes(term));

    const matchesProvider = providerFilter === 'ALL' || s.provider === providerFilter;

    const canonical = getCanonicalCourierStatus(s.status);

    let matchesTab = true;
    if (statusTab === 'IN_TRANSIT') {
      matchesTab = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ATTEMPTED'].includes(canonical);
    } else if (statusTab === 'DELIVERED') {
      matchesTab = canonical === 'DELIVERED';
    } else if (statusTab === 'RETURNS') {
      matchesTab = canonical === 'RETURNED';
    } else if (statusTab === 'CANCELLED_ARCHIVED') {
      matchesTab = ['CANCELLED', 'FAILED', 'ARCHIVED'].includes(canonical);
    }

    return matchesSearch && matchesProvider && matchesTab;
  });

  // Calculate Canonical Metrics
  const activeShipmentsList = shipments.filter((s) => isValidActiveShipment(s.status));
  const activeShipmentCount = activeShipmentsList.length;
  const totalActiveCod = activeShipmentsList.reduce((sum, s) => sum + (s.codAmount || 0), 0);
  const deliveredShipments = shipments.filter((s) => getCanonicalCourierStatus(s.status) === 'DELIVERED');
  const deliveredPendingSettlement = deliveredShipments.filter(
    (s) => s.settlementStatus !== 'SETTLED' && s.settlementStatus !== 'PAID'
  );
  const totalPendingSettlementValue = deliveredPendingSettlement.reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <div className="admin-page text-[#FAF8F5]">
      {/* Header Banner */}
      <div className="admin-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] bg-teal-950/80 px-3 py-0.5 rounded-md border border-[#D4AF37]/30">
              <Truck className="w-3 h-3 text-[#D4AF37]" /> Courier Control Tower
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              POSTEX M-V4.1.9 READY
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#FAF8F5]">
            Shipping & PostEx Command Hub
          </h1>
          <p className="text-xs text-[#FAF8F5]/60 mt-1 font-sans">
            Dispatch orders, print official PDF airway bills, track live parcels, and reconcile COD settlement payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleTestDiagnostics}
            disabled={testingConnection}
            className="px-3 py-2 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            {testingConnection ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            <span>Courier Health Check</span>
          </button>

          <Link
            href="/admin/shipping/returns"
            className="px-3 py-2 bg-[#1A1505] hover:bg-[#2A2005] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returns &amp; Issues</span>
          </Link>

          <Link
            href="/admin/shipping/cod"
            className="px-3.5 py-2 bg-[#D4AF37] hover:bg-white text-black rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all shadow-lg flex items-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>COD Settlements</span>
          </Link>
        </div>
      </div>

      {/* Diagnostics Alert */}
      {diagnosticResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-4 ${
            diagnosticResult.includes('success') || diagnosticResult.includes('connected')
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-950/50 text-amber-200 border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>{diagnosticResult}</span>
          </div>
          <button onClick={() => setDiagnosticResult(null)} className="text-white/60 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {globalBanner && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-4 ${
            globalBanner.isError ? 'bg-red-950/60 text-red-300 border-red-500/40' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
          }`}
        >
          <span>{globalBanner.text}</span>
          <button onClick={() => setGlobalBanner(null)} className="text-white/60 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Active Parcels</span>
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5]">{activeShipmentCount}</p>
          <span className="text-[11px] text-[#FAF8F5]/60 font-medium">Rs. {totalActiveCod.toLocaleString()} Active COD</span>
        </div>

        <div className="admin-stat-card border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Ready to Dispatch</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-amber-400">{confirmedOrders.length}</p>
          <span className="text-[11px] text-amber-300/80 font-medium">Confirmed orders awaiting courier</span>
        </div>

        <div className="admin-stat-card border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Delivered &amp; Pending CPR</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-400">Rs. {totalPendingSettlementValue.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-300/80 font-medium">
            {deliveredPendingSettlement.length} delivered parcel(s) awaiting remittance
          </span>
        </div>

        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Pickup Origin</span>
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-mono font-bold text-[#D4AF37] truncate">
            {siteSettings.postex_pickup_address_code ? `Code: ${siteSettings.postex_pickup_address_code}` : 'Lahore Atelier'}
          </p>
          <span className="text-[10px] text-[#FAF8F5]/60 block truncate">
            {siteSettings.postex_pickup_address_name || 'Primary Merchant Warehouse'}
          </span>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528] p-4 rounded-2xl border border-[#D4AF37]/15">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === 'ALL' ? 'bg-[#D4AF37] text-black font-bold' : 'bg-[#06191B] text-[#FAF8F5]/70 hover:text-white'
            }`}
          >
            All Shipments ({shipments.length})
          </button>
          <button
            onClick={() => setStatusTab('READY_FOR_POSTEX')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === 'READY_FOR_POSTEX'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#06191B] text-amber-300 hover:text-white'
            }`}
          >
            Ready for PostEx ({confirmedOrders.length})
          </button>
          <button
            onClick={() => setStatusTab('IN_TRANSIT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === 'IN_TRANSIT' ? 'bg-[#D4AF37] text-black font-bold' : 'bg-[#06191B] text-[#FAF8F5]/70 hover:text-white'
            }`}
          >
            In Transit ({activeShipmentCount})
          </button>
          <button
            onClick={() => setStatusTab('DELIVERED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === 'DELIVERED'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#06191B] text-emerald-300 hover:text-white'
            }`}
          >
            Delivered ({deliveredShipments.length})
          </button>
          <button
            onClick={() => setStatusTab('RETURNS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === 'RETURNS' ? 'bg-rose-500 text-white font-bold' : 'bg-[#06191B] text-rose-300 hover:text-white'
            }`}
          >
            Returns / RTO
          </button>
          <button
            onClick={() => setStatusTab('CANCELLED_ARCHIVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusTab === 'CANCELLED_ARCHIVED'
                ? 'bg-zinc-700 text-white font-bold'
                : 'bg-[#06191B] text-zinc-400 hover:text-white'
            }`}
          >
            Cancelled & Archived
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#D4AF37]/70 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Tracking #, Order #, Customer, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Main Table View */}
      {statusTab === 'READY_FOR_POSTEX' ? (
        /* Confirmed Orders Awaiting Courier Dispatch */
        <div className="admin-table-wrapper">
          <div className="p-5 border-b border-[#D4AF37]/15 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#D4AF37]">
                Orders Ready for 1-Click PostEx Booking ({confirmedOrders.length})
              </h3>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                These orders are confirmed. Click &quot;Send to PostEx&quot; to book a parcel and generate official tracking.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
                <tr>
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Destination City</th>
                  <th className="p-3.5">COD Amount</th>
                  <th className="p-3.5">Confirmed Date</th>
                  <th className="p-3.5 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {confirmedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[#FAF8F5]/50">
                      <Package className="w-8 h-8 mx-auto text-[#D4AF37]/40 mb-2" />
                      <p className="font-semibold text-sm text-[#FAF8F5]/70">No confirmed orders awaiting dispatch</p>
                      <p className="text-xs text-[#FAF8F5]/40 mt-0.5">When new orders are confirmed, they will appear here for 1-click booking.</p>
                    </td>
                  </tr>
                ) : (
                  confirmedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#103A3E]/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline flex items-center gap-1">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-[#FAF8F5] block">{order.customerName}</span>
                        <span className="text-[11px] font-mono text-[#FAF8F5]/60">{order.customerPhone}</span>
                      </td>
                      <td className="p-3.5 text-[#FAF8F5] font-medium">{order.shippingCity}</td>
                      <td className="p-3.5 font-mono font-bold text-[#FAF8F5]">Rs. {order.totalAmount.toLocaleString()}</td>
                      <td className="p-3.5 text-[#FAF8F5]/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSendOrderToPostEx(order.id)}
                          disabled={dispatchingId === order.id}
                          className="bg-[#D4AF37] hover:bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all shadow disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          {dispatchingId === order.id ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...</>
                          ) : (
                            <><Send className="w-3.5 h-3.5" /> Send to PostEx</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Redesigned Enterprise Shipments Table */
        <div className="admin-table-wrapper">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
                <tr>
                  <th className="p-3.5">Tracking #</th>
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Customer & City</th>
                  <th className="p-3.5">Courier Status</th>
                  <th className="p-3.5">COD Amount</th>
                  <th className="p-3.5">Settlement / CPR</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-[#FAF8F5]/50">
                      <Truck className="w-8 h-8 mx-auto text-[#D4AF37]/40 mb-2" />
                      <p className="font-semibold text-sm text-[#FAF8F5]/70">No shipments found in this filter</p>
                      <p className="text-xs text-[#FAF8F5]/40 mt-0.5">Adjust your filter tab or search keywords to view parcels.</p>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => {
                    const tracking = shipment.trackingNumber;
                    const statusBadge = getCourierStatusBadgeInfo(shipment.status);
                    const settlementBadge = getSettlementStatusBadgeInfo(shipment.settlementStatus, shipment.status);
                    const hasValidTracking = Boolean(tracking && tracking !== 'Pending' && tracking !== 'null');
                    const isFailedOrTest = shipment.status === 'FAILED' || !hasValidTracking;
                    const isCancelledOrArchived = ['CANCELLED', 'ARCHIVED'].includes(statusBadge.status);

                    return (
                      <tr key={shipment.id} className="hover:bg-[#103A3E]/30 transition-colors">
                        {/* Tracking # & Courier */}
                        <td className="p-3.5">
                          {hasValidTracking ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#D4AF37] text-sm">
                                  {tracking}
                                </span>
                                <button
                                  onClick={() => handleCopy(tracking!, shipment.id)}
                                  className="p-1 text-[#FAF8F5]/50 hover:text-[#D4AF37] rounded"
                                  title="Copy Tracking Number"
                                >
                                  {copiedId === shipment.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-[#FAF8F5]/50 uppercase font-semibold block">
                                {shipment.provider || 'PostEx'}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-mono text-xs text-red-400 font-semibold block">
                                No Tracking Assigned
                              </span>
                              <span className="text-[10px] text-[#FAF8F5]/50 uppercase">
                                {shipment.status === 'FAILED' ? 'Failed Attempt' : 'Pending'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Order Number */}
                        <td className="p-3.5 font-mono">
                          {shipment.order ? (
                            <Link
                              href={`/admin/orders/${shipment.order.id}`}
                              className="text-[#FAF8F5] hover:text-[#D4AF37] hover:underline font-bold"
                            >
                              {shipment.order.orderNumber}
                            </Link>
                          ) : (
                            <span className="text-[#FAF8F5]/60">{shipment.orderRefNumber || 'N/A'}</span>
                          )}
                          <span className="text-[10px] text-[#FAF8F5]/40 block">
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Customer & City */}
                        <td className="p-3.5">
                          <span className="font-semibold text-[#FAF8F5] block">
                            {shipment.order?.customerName || 'Customer'}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-[#FAF8F5]/60">
                            <span>{shipment.order?.shippingCity}</span>
                            {shipment.order?.customerPhone && (
                              <span className="font-mono text-[#FAF8F5]/50">({shipment.order.customerPhone})</span>
                            )}
                          </div>
                        </td>

                        {/* Canonical Courier Status Badge */}
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                              {statusBadge.label}
                            </span>
                            {statusBadge.sublabel && (
                              <span className="text-[9.5px] text-[#FAF8F5]/50 block">
                                {statusBadge.sublabel}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* COD Amount */}
                        <td className="p-3.5 font-mono font-bold text-[#FAF8F5]">
                          Rs. {shipment.codAmount.toLocaleString()}
                        </td>

                        {/* Settlement / CPR */}
                        <td className="p-3.5">
                          {shipment.cprNumber ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                                CPR: {shipment.cprNumber}
                              </span>
                              <span className="text-[9px] text-emerald-300/70 uppercase">Settled</span>
                            </div>
                          ) : (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${settlementBadge.badgeClass}`}
                            >
                              {settlementBadge.label}
                            </span>
                          )}
                        </td>

                        {/* Actions with Clear Hierarchy */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="admin-action-group">
                            {/* Primary Action: Official PDF Airway Bill */}
                            {hasValidTracking && (
                              <a
                                href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(tracking!)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-[#D4AF37] hover:bg-white text-black px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1"
                                title="Print Official PostEx Airway Bill PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>AWB</span>
                              </a>
                            )}

                            {/* Secondary Action: Send WhatsApp Tracking */}
                            {hasValidTracking && shipment.order && (
                              <button
                                onClick={() => {
                                  setWhatsappModal({
                                    orderId: shipment.orderId,
                                    orderNumber: shipment.order!.orderNumber,
                                    customerName: shipment.order!.customerName,
                                    customerPhone: shipment.order!.customerPhone,
                                    trackingNumber: tracking!,
                                  });
                                  setWhatsappFeedback(null);
                                }}
                                className="p-1.5 bg-emerald-950/70 hover:bg-emerald-700 text-emerald-300 hover:text-white rounded-lg border border-emerald-700/40 transition-all"
                                title="Send Tracking via WhatsApp"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Secondary Action: Refresh Live Tracking */}
                            {hasValidTracking && (
                              <button
                                onClick={() => handleRefreshTracking(tracking!, shipment.orderId)}
                                className="p-1.5 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30 transition-all"
                                title="Track Parcel on PostEx"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Secondary Action: Check Settlement */}
                            {hasValidTracking && (
                              <button
                                onClick={() => handleCheckSettlement(tracking!, shipment.orderId)}
                                className="p-1.5 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30 transition-all"
                                title="Check COD Settlement & CPR"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Safe Admin Action: Archive or Remove Test */}
                            {isCancelledOrArchived && (
                              <button
                                onClick={() => setArchiveModalShipment(shipment)}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-600/40 transition-all"
                                title="Archive Shipment"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isFailedOrTest && (
                              <button
                                onClick={() => setDeleteModalShipment(shipment)}
                                className="p-1.5 bg-red-950/70 hover:bg-red-800 text-red-300 hover:text-white rounded-lg border border-red-700/40 transition-all"
                                title="Remove Failed Test Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WhatsApp Tracking Send Modal */}
      {whatsappModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="font-serif text-lg font-bold text-[#FAF8F5]">Send Tracking to Customer</h3>
              </div>
              <button onClick={() => setWhatsappModal(null)} className="text-white/60 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#06191B] p-3.5 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#FAF8F5]/60">Order #:</span>
                  <span className="font-bold font-mono text-[#D4AF37]">{whatsappModal.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FAF8F5]/60">Customer:</span>
                  <span className="font-semibold text-[#FAF8F5]">{whatsappModal.customerName}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#FAF8F5]/60">Phone:</span>
                  <span className="text-emerald-400 font-bold">{whatsappModal.customerPhone}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#FAF8F5]/60">PostEx Tracking:</span>
                  <span className="text-[#D4AF37] font-bold">{whatsappModal.trackingNumber}</span>
                </div>
              </div>

              {whatsappFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium space-y-2 ${
                    whatsappFeedback.isError
                      ? 'bg-red-950/60 text-red-300 border-red-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  <p>{whatsappFeedback.text}</p>
                  {whatsappFeedback.whatsappUrl && (
                    <a
                      href={whatsappFeedback.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 underline hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" /> Open in WhatsApp Web / App
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="px-4 py-2 rounded-xl text-xs bg-[#06191B] text-[#FAF8F5]/70 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={handleSendWhatsappTracking}
                  disabled={sendingWhatsapp}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow"
                >
                  {sendingWhatsapp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {whatsappFeedback && !whatsappFeedback.isError ? 'Resend Tracking' : 'Send WhatsApp Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Modal */}
      {activeTracking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  PostEx Live Parcel Tracking
                </h3>
                <span className="font-mono text-xs text-[#FAF8F5]/70">Tracking ID: {activeTracking.trackingNumber}</span>
              </div>
              <button onClick={() => setActiveTracking(null)} className="p-1.5 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {trackingLoading ? (
              <div className="py-12 text-center text-[#D4AF37] space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-xs">Querying PostEx Tracking API...</p>
              </div>
            ) : activeTracking.error ? (
              <div className="p-4 bg-red-950/50 border border-red-500/40 text-red-300 rounded-xl text-xs">
                {activeTracking.error}
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                <div className="bg-[#06191B] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">Current Status</span>
                    <span className="font-serif text-lg font-bold text-[#FAF8F5]">
                      {activeTracking.rawStatus || activeTracking.status}
                    </span>
                  </div>
                  {activeTracking.statusDetails && (
                    <span className="text-xs text-[#FAF8F5]/70 font-mono">{activeTracking.statusDetails}</span>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Shipment Timeline</h4>
                  {activeTracking.history && activeTracking.history.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeTracking.history.map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-xs border-l-2 border-[#D4AF37]/40 pl-3 py-0.5">
                          <div>
                            <span className="font-bold text-[#FAF8F5] block">{h.status || h.transactionStatusMessage}</span>
                            {h.remarks && <p className="text-[11px] text-[#FAF8F5]/70">{h.remarks}</p>}
                            <span className="text-[10px] text-[#D4AF37] font-mono">
                              {h.timestamp || h.updatedAt ? new Date(h.timestamp || h.updatedAt).toLocaleString() : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#FAF8F5]/50 italic">No timeline entries reported by courier yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COD Settlement Modal */}
      {activeSettlement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">COD Payment Settlement</h3>
                <span className="font-mono text-xs text-[#FAF8F5]/70">Tracking: {activeSettlement.trackingNumber}</span>
              </div>
              <button onClick={() => setActiveSettlement(null)} className="p-1.5 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {settlementLoading ? (
              <div className="py-12 text-center text-[#D4AF37] space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-xs">Querying PostEx Payment Status...</p>
              </div>
            ) : activeSettlement.error ? (
              <div className="p-4 bg-amber-950/50 border border-amber-500/40 text-amber-200 rounded-xl text-xs">
                {activeSettlement.error}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="bg-[#06191B] p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#FAF8F5]/70">Settlement Status:</span>
                    <span className="font-bold text-emerald-400 uppercase">
                      {activeSettlement.settlementStatus || 'Pending'}
                    </span>
                  </div>
                  {(activeSettlement.cprNumber || activeSettlement.cprNumber_1) && (
                    <div className="flex justify-between font-mono">
                      <span className="text-[#FAF8F5]/70">CPR / Cheque #:</span>
                      <span className="font-bold text-[#D4AF37]">
                        {activeSettlement.cprNumber || activeSettlement.cprNumber_1}
                      </span>
                    </div>
                  )}
                  {activeSettlement.settlementDate && (
                    <div className="flex justify-between">
                      <span className="text-[#FAF8F5]/70">Settlement Date:</span>
                      <span className="font-mono">{new Date(activeSettlement.settlementDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {activeSettlement.invoicePayment && (
                    <div className="flex justify-between font-bold border-t border-white/10 pt-2 text-[#FAF8F5]">
                      <span>COD Collected:</span>
                      <span className="font-mono text-[#D4AF37]">
                        Rs. {Number(activeSettlement.invoicePayment).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveModalShipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-zinc-300">
              <Archive className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-serif text-lg font-bold">Archive Shipment Record</h3>
            </div>
            <p className="text-xs text-[#FAF8F5]/70">
              Archiving removes this cancelled/delivered shipment from active lists and active counts while preserving the full record for order history and audit logs.
            </p>
            <div className="bg-[#06191B] p-3 rounded-xl border border-white/10 text-xs font-mono">
              <div>Tracking: {archiveModalShipment.trackingNumber || 'N/A'}</div>
              <div>Order: {archiveModalShipment.order?.orderNumber || archiveModalShipment.orderRefNumber}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setArchiveModalShipment(null)}
                className="px-4 py-2 rounded-xl text-xs bg-[#06191B] text-[#FAF8F5]/70"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteArchive}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-white text-black"
              >
                {actionProcessing ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Test Shipment Modal */}
      {deleteModalShipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Remove Test / Failed Shipment</h3>
            </div>
            <p className="text-xs text-[#FAF8F5]/70 leading-relaxed">
              This will safely remove the failed test dispatch log. The customer order, financial ledger, and inventory records will <strong>NOT</strong> be affected.
            </p>
            <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-xs font-mono text-red-200">
              <div>Shipment ID: {deleteModalShipment.id.slice(0, 16)}...</div>
              <div>Status: {deleteModalShipment.status}</div>
              <div>Order: {deleteModalShipment.order?.orderNumber || 'N/A'}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalShipment(null)}
                className="px-4 py-2 rounded-xl text-xs bg-[#06191B] text-[#FAF8F5]/70"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeleteTest}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                {actionProcessing ? 'Removing...' : 'Remove Test Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
