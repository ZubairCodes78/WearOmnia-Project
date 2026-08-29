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
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
  X,
  MapPin,
  Building,
} from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';

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
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'RETURNS' | 'READY_TO_DISPATCH'>('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Tracking Modal State
  const [activeTracking, setActiveTracking] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Settlement Modal State
  const [activeSettlement, setActiveSettlement] = useState<any | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  // Dispatch Action State
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Diagnostics state
  const [testingConnection, setTestingConnection] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  const handleTestDiagnostics = async () => {
    setTestingConnection(true);
    setDiagnosticResult(null);
    try {
      const res = await fetch('/api/admin/courier/postex/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setDiagnosticResult(data.message || (data.success ? 'PostEx connected successfully!' : 'PostEx API is not configured.'));
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
        // Update local shipment status
        setShipments((prev) =>
          prev.map((s) =>
            s.trackingNumber === trackingNumber ? { ...s, status: data.tracking.rawStatus || data.tracking.status } : s
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
                  cprNumber: data.payment.cprNumber,
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
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/courier/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, providerName: 'POSTEX' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ text: data.error || 'Failed to dispatch order to PostEx.', isError: true });
      } else {
        setActionMessage({ text: `✓ Shipment created on PostEx! Tracking ID: ${data.shipment?.trackingNumber}` });
        router.refresh();
      }
    } catch {
      setActionMessage({ text: 'Network error creating shipment.', isError: true });
    } finally {
      setDispatchingId(null);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (s.trackingNumber && s.trackingNumber.toLowerCase().includes(term)) ||
      (s.orderRefNumber && s.orderRefNumber.toLowerCase().includes(term)) ||
      (s.order?.customerName && s.order.customerName.toLowerCase().includes(term)) ||
      (s.order?.customerPhone && s.order.customerPhone.includes(term)) ||
      (s.order?.shippingCity && s.order.shippingCity.toLowerCase().includes(term));

    const matchesProvider = providerFilter === 'ALL' || s.provider === providerFilter;

    let matchesTab = true;
    if (statusTab === 'ACTIVE') {
      matchesTab = ['PENDING', 'Booked', 'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'Dispatched'].includes(s.status);
    } else if (statusTab === 'DELIVERED') {
      matchesTab = ['DELIVERED', 'Delivered'].includes(s.status);
    } else if (statusTab === 'RETURNS') {
      matchesTab = ['RETURNED', 'Returned', 'CANCELLED', 'Cancelled', 'Un-Delivered'].includes(s.status);
    }

    return matchesSearch && matchesProvider && matchesTab;
  });

  const totalCodActive = shipments
    .filter((s) => !['CANCELLED', 'RETURNED', 'Returned'].includes(s.status))
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  const totalDeliveredSettled = shipments
    .filter((s) => ['DELIVERED', 'Delivered'].includes(s.status) && s.settlementStatus === 'SETTLED')
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  const totalPendingSettlement = shipments
    .filter((s) => ['DELIVERED', 'Delivered'].includes(s.status) && s.settlementStatus !== 'SETTLED')
    .reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header Banner */}
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <Truck className="w-3 h-3 text-[#D4AF37]" /> Courier Control Tower
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              POSTEX API V3 READY
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#FAF8F5] mt-2">
            Shipping & PostEx Command Hub
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            1-Click manual dispatch, live parcel tracking, official PDF airway bills, and COD settlement reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTestDiagnostics}
            disabled={testingConnection}
            className="bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-2"
          >
            {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Test PostEx API
          </button>
          <Link
            href="/admin/settings"
            className="bg-[#D4AF37] text-black hover:bg-white px-5 py-2.5 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-lg flex items-center gap-2"
          >
            Configure PostEx
          </Link>
        </div>
      </div>

      {/* Diagnostics Alert Banner */}
      {diagnosticResult && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-4 ${
          diagnosticResult.includes('✓') || diagnosticResult.includes('successful')
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
            : 'bg-amber-950/40 text-amber-200 border-amber-500/40'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>{diagnosticResult}</span>
          </div>
          <button onClick={() => setDiagnosticResult(null)} className="text-white/60 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-4 ${
          actionMessage.isError ? 'bg-red-950/50 text-red-300 border-red-500/40' : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-white/60 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* PostEx Account & Courier Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Total Shipments Booked</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5]">{shipments.length}</p>
          <span className="text-[11px] text-[#FAF8F5]/60 font-semibold">Rs. {totalCodActive.toLocaleString()} Total COD</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Ready To Dispatch</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-amber-400">{confirmedOrders.length}</p>
          <span className="text-[11px] text-amber-300 font-semibold">Confirmed Orders Awaiting Courier</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Delivered & Pending CPR</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-400">Rs. {totalPendingSettlement.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-300/80 font-semibold">Awaiting Courier Bank Transfer</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-5 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Pickup Configuration</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-mono font-bold text-[#D4AF37] truncate">
            {siteSettings.postex_pickup_address_code ? `Code: ${siteSettings.postex_pickup_address_code}` : 'Unconfigured'}
          </p>
          <span className="text-[10px] text-[#FAF8F5]/60 block truncate">
            {siteSettings.postex_pickup_address_name || 'Lahore Atelier Origin'}
          </span>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusTab === 'ALL' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            All Shipments ({shipments.length})
          </button>
          <button
            onClick={() => setStatusTab('READY_TO_DISPATCH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusTab === 'READY_TO_DISPATCH' ? 'bg-amber-500 text-black shadow' : 'bg-[#06191B] text-amber-300 hover:text-white'
            }`}
          >
            Ready for PostEx ({confirmedOrders.length})
          </button>
          <button
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusTab === 'ACTIVE' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            In Transit
          </button>
          <button
            onClick={() => setStatusTab('DELIVERED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusTab === 'DELIVERED' ? 'bg-emerald-500 text-black shadow' : 'bg-[#06191B] text-emerald-300 hover:text-white'
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setStatusTab('RETURNS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              statusTab === 'RETURNS' ? 'bg-red-500 text-white shadow' : 'bg-[#06191B] text-red-300 hover:text-white'
            }`}
          >
            Returns / RTO
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Tracking ID, Order #, City, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>
      </div>

      {/* Main View: Ready for PostEx or Shipments Table */}
      {statusTab === 'READY_TO_DISPATCH' ? (
        /* Confirmed Orders Awaiting Dispatch */
        <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-[#D4AF37]/15 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                Confirmed Orders Ready for 1-Click PostEx Dispatch ({confirmedOrders.length})
              </h3>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                These orders have been verified and confirmed. Click &quot;Send to PostEx&quot; to book a parcel and generate official tracking.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Delivery City</th>
                  <th className="p-4">COD Amount</th>
                  <th className="p-4">Confirmed Date</th>
                  <th className="p-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {confirmedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#FAF8F5]/50 italic">
                      No confirmed orders awaiting dispatch at this time.
                    </td>
                  </tr>
                ) : (
                  confirmedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#103A3E]/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#D4AF37]">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#FAF8F5] block">{order.customerName}</span>
                        <span className="text-[11px] font-mono text-[#FAF8F5]/60">{order.customerPhone}</span>
                      </td>
                      <td className="p-4 text-[#FAF8F5] font-semibold">{order.shippingCity}</td>
                      <td className="p-4 font-mono font-bold text-[#FAF8F5]">Rs. {order.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-[#FAF8F5]/70">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleSendOrderToPostEx(order.id)}
                          disabled={dispatchingId === order.id}
                          className="bg-[#D4AF37] hover:bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow disabled:opacity-50 inline-flex items-center gap-1.5"
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
        /* Shipments Table */
        <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
                <tr>
                  <th className="p-4">Tracking #</th>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer & City</th>
                  <th className="p-4">Courier Status</th>
                  <th className="p-4">COD Amount</th>
                  <th className="p-4">Settlement / CPR</th>
                  <th className="p-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-[#FAF8F5]/50 italic">
                      No shipments found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => {
                    const tracking = shipment.trackingNumber || 'Pending';
                    const isDelivered = ['DELIVERED', 'Delivered'].includes(shipment.status);
                    const isReturned = ['RETURNED', 'Returned', 'CANCELLED', 'Cancelled'].includes(shipment.status);

                    return (
                      <tr key={shipment.id} className="hover:bg-[#103A3E]/40 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-[#D4AF37] text-sm block">
                            {tracking}
                          </span>
                          <span className="text-[10px] text-[#FAF8F5]/50 uppercase">{shipment.provider || 'PostEx'}</span>
                        </td>
                        <td className="p-4 font-mono font-semibold">
                          {shipment.order ? (
                            <Link href={`/admin/orders/${shipment.order.id}`} className="text-[#FAF8F5] hover:text-[#D4AF37] hover:underline">
                              {shipment.order.orderNumber}
                            </Link>
                          ) : (
                            shipment.orderRefNumber || 'N/A'
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-[#FAF8F5] block">{shipment.order?.customerName || 'Customer'}</span>
                          <span className="text-[11px] text-[#FAF8F5]/60">{shipment.order?.shippingCity}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isDelivered
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : isReturned
                              ? 'bg-red-950/60 text-red-300 border-red-500/40'
                              : 'bg-teal-950/60 text-[#D4AF37] border-[#D4AF37]/30'
                          }`}>
                            {shipment.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#FAF8F5]">
                          Rs. {shipment.codAmount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          {shipment.cprNumber ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold block">CPR: {shipment.cprNumber}</span>
                              <span className="text-[9px] text-[#FAF8F5]/50">{shipment.settlementStatus || 'Settled'}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#FAF8F5]/50 italic">
                              {shipment.settlementStatus || 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Official PostEx Label PDF */}
                          {tracking !== 'Pending' && (
                            <a
                              href={`/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(tracking)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-[#0D3337] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-lg border border-[#D4AF37]/30 transition-all inline-block align-middle"
                              title="Print Official PostEx Airway Bill PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Refresh Tracking */}
                          {tracking !== 'Pending' && (
                            <button
                              onClick={() => handleRefreshTracking(tracking, shipment.orderId)}
                              className="p-2 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30 transition-all inline-block align-middle"
                              title="Live Tracking Status"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Send Tracking Notification to Customer */}
                          {tracking !== 'Pending' && shipment.order && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/admin/orders/notify-tracking', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      orderId: shipment.orderId,
                                      trackingNumber: tracking,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    alert(`✓ Tracking notification sent to customer for #${shipment.order?.orderNumber}`);
                                  } else {
                                    alert(`Error: ${data.error || 'Failed to send tracking'}`);
                                  }
                                } catch {
                                  alert('Network error notifying customer.');
                                }
                              }}
                              className="p-2 bg-emerald-950 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg border border-emerald-800/40 transition-all inline-block align-middle"
                              title="Send Tracking to Customer via WhatsApp/SMS"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Check Settlement */}
                          {tracking !== 'Pending' && (
                            <button
                              onClick={() => handleCheckSettlement(tracking, shipment.orderId)}
                              className="p-2 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30 transition-all inline-block align-middle"
                              title="Check Settlement & CPR Status"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Order Detail Link */}
                          {shipment.order && (
                            <Link
                              href={`/admin/orders/${shipment.order.id}`}
                              className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border border-[#D4AF37]/30 inline-block align-middle"
                            >
                              Order →
                            </Link>
                          )}
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

      {/* Live Tracking Modal */}
      {activeTracking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  PostEx Live Parcel Tracking
                </h3>
                <span className="font-mono text-xs text-[#FAF8F5]/70">Tracking ID: {activeTracking.trackingNumber}</span>
              </div>
              <button onClick={() => setActiveTracking(null)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {trackingLoading ? (
              <div className="py-12 text-center text-[#D4AF37] space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-xs">Querying PostEx Tracking API...</p>
              </div>
            ) : activeTracking.error ? (
              <div className="p-4 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl text-xs">
                {activeTracking.error}
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">Current Status</span>
                    <span className="font-serif text-xl font-bold text-[#FAF8F5]">{activeTracking.rawStatus || activeTracking.status}</span>
                  </div>
                  {activeTracking.statusDetails && (
                    <span className="text-xs text-[#FAF8F5]/70 font-mono">{activeTracking.statusDetails}</span>
                  )}
                </div>

                {/* Tracking History Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Shipment Timeline</h4>
                  {activeTracking.history && activeTracking.history.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeTracking.history.map((h: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-xs border-l-2 border-[#D4AF37]/40 pl-3 py-0.5">
                          <div>
                            <span className="font-bold text-[#FAF8F5] block">{h.status}</span>
                            {h.remarks && <p className="text-[11px] text-[#FAF8F5]/70">{h.remarks}</p>}
                            <span className="text-[10px] text-[#D4AF37] font-mono">
                              {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
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
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  COD Payment Settlement
                </h3>
                <span className="font-mono text-xs text-[#FAF8F5]/70">Tracking: {activeSettlement.trackingNumber}</span>
              </div>
              <button onClick={() => setActiveSettlement(null)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {settlementLoading ? (
              <div className="py-12 text-center text-[#D4AF37] space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-xs">Querying PostEx Payment Status...</p>
              </div>
            ) : activeSettlement.error ? (
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-xl text-xs">
                {activeSettlement.error}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/20 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#FAF8F5]/70">Settlement Status:</span>
                    <span className="font-bold text-emerald-400 uppercase">{activeSettlement.settlementStatus || 'Pending'}</span>
                  </div>
                  {activeSettlement.cprNumber && (
                    <div className="flex justify-between font-mono">
                      <span className="text-[#FAF8F5]/70">CPR / Cheque #:</span>
                      <span className="font-bold text-[#D4AF37]">{activeSettlement.cprNumber}</span>
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
                      <span className="font-mono text-[#D4AF37]">Rs. {Number(activeSettlement.invoicePayment).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
