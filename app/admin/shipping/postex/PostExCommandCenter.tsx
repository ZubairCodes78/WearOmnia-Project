'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Building,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  MapPin,
  Package,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Truck,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SiteSettingsData } from '@/lib/settings';
import { POSTEX_STATUS_MAP, POSTEX_MESSAGE_CODES } from '@/lib/courier/types';

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
    totalAmount: number;
    status: string;
  };
}

interface PostExCommandCenterProps {
  siteSettings: SiteSettingsData;
  initialShipments: ShipmentItem[];
  stats: {
    confirmedOrdersCount: number;
    pendingSettlementCount: number;
  };
}

export function PostExCommandCenter({ siteSettings, initialShipments, stats }: PostExCommandCenterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'connection' | 'pickup' | 'cities' | 'shipments' | 'tracking' | 'settlement' | 'labels' | 'returns' | 'diagnostics'
  >('connection');

  // Diagnostics State
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);

  // Merchant Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    cityName: 'Lahore',
    address: '',
    contactPersonName: siteSettings.businessName || 'WearOMNIA',
    phone1: siteSettings.storePhone || '03180633323',
    phone2: '03180633323',
    addressTypeId: 2, // 2 = Pickup
  });

  // Operational Cities State
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [cityTypeFilter, setCityTypeFilter] = useState<'All' | 'Pickup' | 'Delivery'>('All');

  // Tracking Lookup State
  const [lookupTracking, setLookupTracking] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingDetail, setTrackingDetail] = useState<any | null>(null);
  const [trackingError, setTrackingError] = useState('');

  // Bulk Tracking State
  const [bulkTrackingInput, setBulkTrackingInput] = useState('');
  const [bulkTrackingLoading, setBulkTrackingLoading] = useState(false);
  const [bulkTrackingResults, setBulkTrackingResults] = useState<any[]>([]);

  // COD Settlement Lookup State
  const [settlementTracking, setSettlementTracking] = useState('');
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementDetail, setSettlementDetail] = useState<any | null>(null);
  const [settlementError, setSettlementError] = useState('');

  // Shipper Advice State
  const [adviceTracking, setAdviceTracking] = useState('');
  const [adviceChoice, setAdviceChoice] = useState<'1' | '2'>('2');
  const [adviceRemarks, setAdviceRemarks] = useState('');
  const [savingAdvice, setSavingAdvice] = useState(false);
  const [adviceMessage, setAdviceMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Label batch state
  const [batchLabelInput, setBatchLabelInput] = useState('');

  // 1. Run Diagnostics
  const handleRunDiagnostics = async () => {
    setDiagnosticsRunning(true);
    setDiagnosticResult(null);
    try {
      const res = await fetch('/api/admin/courier/postex/test-connection', { method: 'POST' });
      const data = await res.json();
      setDiagnosticResult(data);
      if (data.addresses && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } catch {
      setDiagnosticResult({ success: false, message: 'Network connection failure testing PostEx API.' });
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  // 2. Fetch Merchant Addresses
  const handleFetchAddresses = async () => {
    setLoadingAddresses(true);
    setAddressMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/merchant-address');
      const data = await res.json();
      if (!res.ok) {
        setAddressMessage(data.error || 'Failed to fetch merchant addresses.');
      } else {
        setAddresses(data.addresses || []);
        setAddressMessage(
          data.addresses?.length > 0
            ? `✓ Successfully loaded ${data.addresses.length} merchant pickup address(es).`
            : '0 pickup addresses returned by PostEx API for this account.'
        );
      }
    } catch {
      setAddressMessage('Error communicating with merchant address endpoint.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  // 3. Create Merchant Address
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAddress(true);
    setAddressMessage('');
    try {
      const res = await fetch('/api/admin/courier/postex/merchant-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddressForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddressMessage(data.error || 'Failed to create pickup address on PostEx.');
      } else {
        setAddressMessage('✓ Merchant pickup address created successfully on PostEx!');
        handleFetchAddresses();
      }
    } catch {
      setAddressMessage('Network error creating pickup address.');
    } finally {
      setCreatingAddress(false);
    }
  };

  // 4. Fetch Operational Cities
  const handleFetchCities = async () => {
    setLoadingCities(true);
    try {
      const query = cityTypeFilter !== 'All' ? `?operationalCityType=${cityTypeFilter}` : '';
      const res = await fetch(`/api/admin/courier/postex/cities${query}`);
      const data = await res.json();
      if (res.ok && data.cities) {
        setCities(data.cities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCities(false);
    }
  };

  // 5. Track Order
  const handleTrackSingle = async (trackingNo: string) => {
    if (!trackingNo.trim()) return;
    setTrackingLoading(true);
    setTrackingError('');
    setTrackingDetail(null);
    try {
      const res = await fetch('/api/admin/courier/postex/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNo.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.tracking) {
        setTrackingError(data.error || 'Could not find tracking details for this parcel.');
      } else {
        setTrackingDetail(data.tracking);
      }
    } catch {
      setTrackingError('Network error checking tracking information.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // 6. Check Settlement
  const handleCheckSettlement = async (trackingNo: string) => {
    if (!trackingNo.trim()) return;
    setSettlementLoading(true);
    setSettlementError('');
    setSettlementDetail(null);
    try {
      const res = await fetch('/api/admin/courier/postex/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNo.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.payment) {
        setSettlementError(data.error || 'Settlement information not available.');
      } else {
        setSettlementDetail(data.payment);
      }
    } catch {
      setSettlementError('Network error checking settlement.');
    } finally {
      setSettlementLoading(false);
    }
  };

  // 7. Save Shipper Advice
  const handleSaveShipperAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adviceTracking.trim()) return;
    setSavingAdvice(true);
    setAdviceMessage(null);
    try {
      const res = await fetch('/api/admin/courier/postex/shipper-advice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: adviceTracking.trim(),
          shipperAdvice: Number(adviceChoice),
          remarks: adviceRemarks.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdviceMessage({ text: data.error || 'Failed to submit shipper advice.', isError: true });
      } else {
        setAdviceMessage({ text: '✓ Shipper advice submitted successfully to PostEx operations.' });
        setAdviceRemarks('');
      }
    } catch {
      setAdviceMessage({ text: 'Network error submitting shipper advice.', isError: true });
    } finally {
      setSavingAdvice(false);
    }
  };

  const filteredCities = cities.filter((c) =>
    (c.operationalCityName || '').toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Quick Action Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">PostEx Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-[#FAF8F5]">
              {siteSettings.postex_enabled ? 'Active' : 'Disabled'}
            </span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">M-v4.1.9</span>
          </div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1 font-mono">
            {siteSettings.postex_pickup_address_code ? `Code: ${siteSettings.postex_pickup_address_code}` : 'No address code'}
          </div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">Orders Pending Dispatch</span>
            <Package className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-[#FAF8F5]">{stats.confirmedOrdersCount}</span>
            <span className="text-xs text-[#D4AF37]/70">orders</span>
          </div>
          <Link href="/admin/orders" className="text-[11px] text-[#D4AF37] hover:underline mt-1 inline-block">
            View orders awaiting shipment →
          </Link>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">Pending Settlement</span>
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-[#FAF8F5]">{stats.pendingSettlementCount}</span>
            <span className="text-xs text-amber-400 font-medium">COD parcels</span>
          </div>
          <div className="text-[11px] text-[#FAF8F5]/60 mt-1">Reconciliation ready</div>
        </div>

        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]/80">Live Diagnostics</div>
            <div className="text-xs text-[#FAF8F5]/70 mt-1">Check credentials & API connectivity</div>
          </div>
          <button
            onClick={handleRunDiagnostics}
            disabled={diagnosticsRunning}
            className="mt-3 w-full bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] text-xs font-bold uppercase tracking-wider py-2 rounded-xl border border-[#D4AF37]/30 transition-all flex items-center justify-center gap-1.5"
          >
            {diagnosticsRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            Run API Test
          </button>
        </div>
      </div>

      {/* Command Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[#D4AF37]/20 gap-2 pb-2 scrollbar-thin scrollbar-thumb-teal-900">
        {[
          { id: 'connection', label: '1. Connection & Settings', icon: Lock },
          { id: 'pickup', label: '2. Pickup Addresses', icon: MapPin },
          { id: 'cities', label: '3. Operational Cities', icon: Building },
          { id: 'shipments', label: '4. Shipments Log', icon: Truck },
          { id: 'tracking', label: '5. Tracking & History', icon: Search },
          { id: 'settlement', label: '6. COD Settlement', icon: CreditCard },
          { id: 'labels', label: '7. Official AWB PDF', icon: Printer },
          { id: 'returns', label: '8. Shipper Advice (RTO)', icon: RotateCcw },
          { id: 'diagnostics', label: '9. Diagnostics', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'pickup' && addresses.length === 0) handleFetchAddresses();
                if (tab.id === 'cities' && cities.length === 0) handleFetchCities();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15 font-extrabold'
                  : 'bg-[#0A2528] text-[#FAF8F5]/75 hover:bg-[#103A3E] hover:text-[#D4AF37] border border-[#D4AF37]/15'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Connection & Settings */}
      {activeTab === 'connection' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">PostEx API Connection Parameters</h2>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                Strict server-side storage according to official M-v4.1.9 guide. No unnecessary fields.
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="px-3.5 py-1.5 bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30 transition-all flex items-center gap-1.5"
            >
              Configure in Settings <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">API Base URL</label>
                <input
                  type="text"
                  readOnly
                  value={siteSettings.postex_api_url || 'https://api.postex.pk'}
                  className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">API Token Header</label>
                <div className="flex items-center justify-between bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5">
                  <span className="text-xs text-emerald-400 font-mono">
                    {siteSettings.postex_api_token ? '•••••••••••••••••••••••• (Configured Server-Side)' : 'Not configured'}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-[#FAF8F5]/50 mt-1">
                  Passed strictly via <code className="text-[#D4AF37]">token: &lt;merchant token&gt;</code> HTTP header.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/postex` : '/api/webhooks/postex'}
                    className="flex-1 bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/postex`);
                        alert('Webhook URL copied to clipboard!');
                      }
                    }}
                    className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Default Pickup Address Code</label>
                <div className="bg-[#06191B] border border-[#D4AF37]/20 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-bold text-[#FAF8F5] font-mono">
                    {siteSettings.postex_pickup_address_code || 'None selected'}
                  </div>
                  <div className="text-xs text-[#D4AF37]/80">
                    {siteSettings.postex_pickup_address_name || 'Select a pickup address from the Pickup Addresses tab.'}
                  </div>
                </div>
              </div>

              <div className="bg-[#103A3E]/40 border border-[#D4AF37]/20 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase">
                  <HelpCircle className="w-4 h-4" /> M-v4.1.9 Integration Standard
                </div>
                <p className="text-xs text-[#FAF8F5]/70 leading-relaxed">
                  PostEx requires only a valid <code className="text-[#D4AF37]">token</code> header and an operational merchant pickup address. Redundant parameters such as API Key, Merchant ID, or Account ID have been cleanly removed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Pickup Addresses */}
      {activeTab === 'pickup' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Registered PostEx Pickup Addresses</h2>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                GET /services/integration/api/order/v1/get-merchant-address
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleFetchAddresses}
                disabled={loadingAddresses}
                className="bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30 transition-all flex items-center gap-2"
              >
                {loadingAddresses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Refresh Addresses
              </button>
            </div>
          </div>

          {addressMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium ${addressMessage.includes('✓') ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'}`}>
              {addressMessage}
            </div>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-10 bg-[#06191B] rounded-2xl border border-[#D4AF37]/15 space-y-3">
              <MapPin className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <div className="text-sm font-semibold text-[#FAF8F5]">No PostEx Merchant Addresses Loaded</div>
              <p className="text-xs text-[#FAF8F5]/60 max-w-md mx-auto">
                Click &quot;Refresh Addresses&quot; to query your account pickup addresses from PostEx or use the form below to register a new pickup address.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addresses.map((addr, idx) => {
                const isSelected = siteSettings.postex_pickup_address_code === addr.addressCode;
                return (
                  <div
                    key={addr.addressCode || idx}
                    className={`bg-[#06191B] p-5 rounded-2xl border transition-all ${
                      isSelected ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15' : 'border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30">
                        CODE: {addr.addressCode}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected Default
                        </span>
                      )}
                    </div>
                    <div className="font-serif text-base font-bold text-[#FAF8F5] mb-1">{addr.cityName}</div>
                    <div className="text-xs text-[#FAF8F5]/70 mb-3 leading-relaxed">{addr.address}</div>
                    <div className="pt-3 border-t border-[#D4AF37]/15 text-[11px] text-[#FAF8F5]/60 space-y-1 font-mono">
                      <div>Contact: {addr.contactPersonName || 'N/A'}</div>
                      <div>Phone: {addr.phone1 || addr.contactPersonPhone || 'N/A'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Pickup Address Form */}
          <div className="pt-6 border-t border-[#D4AF37]/15">
            <h3 className="font-serif text-base font-bold text-[#FAF8F5] mb-3">
              Register New Merchant Pickup Address (POST /v2/create-merchant-address)
            </h3>
            <form onSubmit={handleCreateAddress} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.cityName}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, cityName: e.target.value })}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.contactPersonName}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, contactPersonName: e.target.value })}
                  placeholder="Manager / Dispatcher Name"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Phone 1 (Mandatory) *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.phone1}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, phone1: e.target.value })}
                  placeholder="03001234567"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Phone 2 (Mandatory) *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.phone2}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, phone2: e.target.value })}
                  placeholder="03180633323"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5] font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Full Pickup Address *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.address}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                  placeholder="e.g. Warehouse #4, Block B, Gulberg III, Lahore"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-3.5 py-2 text-xs text-[#FAF8F5]"
                />
              </div>

              <div className="lg:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={creatingAddress}
                  className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {creatingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Register Pickup Address with PostEx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 3: Operational Cities */}
      {activeTab === 'cities' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Operational Delivery Cities</h2>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                GET /services/integration/api/order/v2/get-operational-city
              </p>
            </div>
            <button
              onClick={handleFetchCities}
              disabled={loadingCities}
              className="bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30 transition-all flex items-center gap-2"
            >
              {loadingCities ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Fetch Operational Cities
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#D4AF37]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search delivery destination city..."
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-[#FAF8F5]"
              />
            </div>
            <select
              value={cityTypeFilter}
              onChange={(e) => setCityTypeFilter(e.target.value as any)}
              className="bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2 text-xs text-[#FAF8F5]"
            >
              <option value="All">All Operations</option>
              <option value="Delivery">Delivery Cities Only</option>
              <option value="Pickup">Pickup Cities Only</option>
            </select>
          </div>

          <div className="bg-[#06191B] border border-[#D4AF37]/15 rounded-2xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-900">
              <table className="w-full text-left text-xs font-sans">
                <thead className="sticky top-0 bg-[#0A2528] border-b border-[#D4AF37]/20 text-[#D4AF37] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">City Name</th>
                    <th className="p-3.5">Country</th>
                    <th className="p-3.5">Delivery Support</th>
                    <th className="p-3.5">Pickup Support</th>
                    <th className="p-3.5">Transit Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/10 text-[#FAF8F5]">
                  {filteredCities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#FAF8F5]/50">
                        {loadingCities ? 'Loading operational cities...' : 'Click "Fetch Operational Cities" to load route table.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCities.slice(0, 100).map((c, i) => (
                      <tr key={i} className="hover:bg-[#103A3E]/40 transition-colors">
                        <td className="p-3.5 font-semibold text-[#FAF8F5]">{c.operationalCityName}</td>
                        <td className="p-3.5 text-[#FAF8F5]/70">{c.countryName || 'Pakistan'}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            Available
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isPickupCity ? 'bg-blue-950 text-blue-400 border border-blue-800/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
                            {c.isPickupCity ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[#D4AF37]">{c.transitDays ? `${c.transitDays} Days` : '2–3 Days'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Shipments Log */}
      {activeTab === 'shipments' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">PostEx Shipments Activity</h2>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                Real-time booking and dispatch records linked with PostEx API.
              </p>
            </div>
            <Link
              href="/admin/shipping"
              className="px-4 py-2 bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-xl text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30 transition-all"
            >
              Full Shipping Console →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#06191B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/20">
                <tr>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Tracking Number</th>
                  <th className="p-3.5">Customer & City</th>
                  <th className="p-3.5">COD Amount</th>
                  <th className="p-3.5">PostEx Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10 text-[#FAF8F5]">
                {initialShipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#FAF8F5]/50">
                      No PostEx shipments created yet. Dispatch confirmed orders from the Orders Console.
                    </td>
                  </tr>
                ) : (
                  initialShipments.map((s) => {
                    const statusMeta = POSTEX_STATUS_MAP[s.status] || {
                      label: s.status,
                      color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                    };
                    return (
                      <tr key={s.id} className="hover:bg-[#103A3E]/40 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-[#D4AF37]">
                          {s.order?.orderNumber || s.orderRefNumber || 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">{s.trackingNumber || 'Pending'}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#FAF8F5]">{s.order?.customerName || 'Customer'}</div>
                          <div className="text-[11px] text-[#FAF8F5]/60">{s.order?.shippingCity || 'Pakistan'}</div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[#FAF8F5]">
                          Rs. {s.codAmount?.toLocaleString() || s.order?.totalAmount?.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {s.trackingNumber && (
                            <>
                              <button
                                onClick={() => {
                                  setActiveTab('tracking');
                                  setLookupTracking(s.trackingNumber!);
                                  handleTrackSingle(s.trackingNumber!);
                                }}
                                className="px-2.5 py-1 bg-[#103A3E] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-lg text-[10px] font-bold uppercase transition-all"
                              >
                                Track
                              </button>
                              <button
                                onClick={async () => {
                                  if (!s.order?.id && !s.orderId) return;
                                  try {
                                    const res = await fetch('/api/admin/orders/notify-tracking', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        orderId: s.order?.id || s.orderId,
                                        trackingNumber: s.trackingNumber,
                                      }),
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      alert(`✓ Tracking notification dispatched for ${s.trackingNumber}`);
                                    } else {
                                      alert(`Error: ${data.error || 'Failed to send tracking notification'}`);
                                    }
                                  } catch {
                                    alert('Network error notifying customer.');
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                                title="Send Tracking to Customer"
                              >
                                Notify
                              </button>
                              <a
                                href={`/api/admin/courier/postex/label?trackingNumber=${s.trackingNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-[#D4AF37] text-black hover:bg-[#FAF8F5] rounded-lg text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3" /> Print Official AWB
                              </a>
                            </>
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

      {/* SECTION 5: Tracking & History */}
      {activeTab === 'tracking' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#D4AF37]/15 pb-4">
            <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Order Tracking & Status History</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
              GET /services/integration/api/order/v1/track-order/&#123;trackingNumber&#125;
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={lookupTracking}
                onChange={(e) => setLookupTracking(e.target.value)}
                placeholder="Enter PostEx tracking number (e.g. 100000000000)"
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] font-mono"
              />
            </div>
            <button
              onClick={() => handleTrackSingle(lookupTracking)}
              disabled={trackingLoading || !lookupTracking.trim()}
              className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {trackingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Track Parcel
            </button>
          </div>

          {trackingError && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{trackingError}</span>
            </div>
          )}

          {trackingDetail && (
            <div className="bg-[#06191B] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-[#D4AF37]/15 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Tracking Number</span>
                  <span className="font-bold text-emerald-400 text-sm">{trackingDetail.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Order Ref #</span>
                  <span className="font-bold text-[#FAF8F5] text-sm">{trackingDetail.orderRefNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Current Status</span>
                  <span className="font-bold text-[#D4AF37] text-sm">{trackingDetail.orderStatus || trackingDetail.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">COD Amount</span>
                  <span className="font-bold text-[#FAF8F5] text-sm">
                    Rs. {Number(trackingDetail.invoicePayment || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h3 className="text-xs uppercase font-bold text-[#D4AF37] tracking-wider mb-4">
                  Official Status History (Codes 0001–0013)
                </h3>
                <div className="space-y-4">
                  {trackingDetail.history && trackingDetail.history.length > 0 ? (
                    trackingDetail.history.map((h: any, idx: number) => {
                      const messageCode = h.messageCode;
                      const codeTitle = messageCode && POSTEX_MESSAGE_CODES[messageCode] ? POSTEX_MESSAGE_CODES[messageCode] : null;
                      return (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="w-3 h-3 rounded-full bg-[#D4AF37] mt-1 shrink-0" />
                          <div className="bg-[#0A2528] border border-[#D4AF37]/15 p-4 rounded-xl flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#FAF8F5]">
                                {codeTitle ? `${codeTitle} (${messageCode})` : (h.status || h.transactionStatus)}
                              </span>
                              <span className="text-[10px] text-[#FAF8F5]/60 font-mono">
                                {h.timestamp ? new Date(h.timestamp).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            {h.location && <div className="text-xs text-[#D4AF37]/80">Location: {h.location}</div>}
                            {h.remarks && <div className="text-xs text-[#FAF8F5]/70">{h.remarks}</div>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-[#FAF8F5]/60">No milestone history available yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: COD Settlement */}
      {activeTab === 'settlement' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#D4AF37]/15 pb-4">
            <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">PostEx COD Settlement & CPR Reconciliation</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
              GET /services/integration/api/order/v1/payment-status/&#123;trackingNumber&#125;
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={settlementTracking}
                onChange={(e) => setSettlementTracking(e.target.value)}
                placeholder="Enter tracking number to check COD remittance & CPR #"
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] font-mono"
              />
            </div>
            <button
              onClick={() => handleCheckSettlement(settlementTracking)}
              disabled={settlementLoading || !settlementTracking.trim()}
              className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {settlementLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              Fetch Settlement
            </button>
          </div>

          {settlementError && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded-xl text-xs">
              {settlementError}
            </div>
          )}

          {settlementDetail && (
            <div className="bg-[#06191B] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-[#0A2528] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Settlement Status</span>
                  <span className="font-bold text-emerald-400 text-base">{settlementDetail.settlementStatus}</span>
                </div>
                <div className="bg-[#0A2528] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">CPR Reference #1</span>
                  <span className="font-bold text-[#FAF8F5] text-base">{settlementDetail.cprNumber_1 || settlementDetail.cprNumber || 'Pending'}</span>
                </div>
                <div className="bg-[#0A2528] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Settlement Date</span>
                  <span className="font-bold text-[#FAF8F5] text-sm">
                    {settlementDetail.settlementDate ? new Date(settlementDetail.settlementDate).toLocaleDateString() : 'Pending'}
                  </span>
                </div>
                <div className="bg-[#0A2528] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Net COD Remittance</span>
                  <span className="font-bold text-[#D4AF37] text-base">
                    Rs. {Number(settlementDetail.netAmount || settlementDetail.codAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: Official AWB PDF Labels */}
      {activeTab === 'labels' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#D4AF37]/15 pb-4">
            <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Official PostEx Airway Bill PDF Dispatch</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
              GET /services/integration/api/order/v1/getinvoice?trackingNumbers=... (Strict PDF stream, max 10 per batch)
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs uppercase font-bold text-[#D4AF37]/80">
              Tracking Numbers (Comma-separated, up to 10 parcels)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={batchLabelInput}
                onChange={(e) => setBatchLabelInput(e.target.value)}
                placeholder="e.g. 100000000001, 100000000002"
                className="flex-1 bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (!batchLabelInput.trim()) return;
                  window.open(`/api/admin/courier/postex/label?trackingNumbers=${encodeURIComponent(batchLabelInput.trim())}`, '_blank');
                }}
                disabled={!batchLabelInput.trim()}
                className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" /> Print Official AWB (Batch PDF)
              </button>
            </div>
            <p className="text-[11px] text-[#FAF8F5]/50">
              PostEx official PDF labels contain official barcodes, routing codes, merchant contact info, and COD payment details. Never use fabricated HTML labels.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 8: Shipper Advice (RTO) */}
      {activeTab === 'returns' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#D4AF37]/15 pb-4">
            <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Submit Shipper Advice (RTO Control)</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
              PUT /service/integration/api/order/v2/save-shipper-advice
            </p>
          </div>

          {adviceMessage && (
            <div className={`p-4 rounded-xl text-xs font-medium ${adviceMessage.isError ? 'bg-red-950/40 text-red-300 border border-red-500/30' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'}`}>
              {adviceMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveShipperAdvice} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Tracking Number *</label>
              <input
                type="text"
                required
                value={adviceTracking}
                onChange={(e) => setAdviceTracking(e.target.value)}
                placeholder="PostEx Tracking Number"
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Advice Action *</label>
              <select
                value={adviceChoice}
                onChange={(e) => setAdviceChoice(e.target.value as any)}
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5]"
              >
                <option value="2">2 — Mark Retry Delivery Attempt (Customer requested re-attempt)</option>
                <option value="1">1 — Mark Return Requested (Cancel and return to origin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#D4AF37]/80 mb-1">Remarks / Reason</label>
              <textarea
                rows={3}
                value={adviceRemarks}
                onChange={(e) => setAdviceRemarks(e.target.value)}
                placeholder="e.g. Customer contacted via WhatsApp; requested re-attempt tomorrow morning."
                className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl p-3.5 text-xs text-[#FAF8F5]"
              />
            </div>

            <button
              type="submit"
              disabled={savingAdvice || !adviceTracking.trim()}
              className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingAdvice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit Shipper Advice to PostEx
            </button>
          </form>
        </div>
      )}

      {/* SECTION 9: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">PostEx API Diagnostic Center</h2>
              <p className="text-xs text-[#FAF8F5]/60 mt-0.5">
                Automated live connectivity, operational route coverage, and merchant authorization tester.
              </p>
            </div>
            <button
              onClick={handleRunDiagnostics}
              disabled={diagnosticsRunning}
              className="bg-[#D4AF37] hover:bg-[#FAF8F5] text-black px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
            >
              {diagnosticsRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Run Live Diagnostic
            </button>
          </div>

          {diagnosticResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${diagnosticResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'}`}>
                <div className="font-bold text-sm mb-1">{diagnosticResult.success ? '✓ Diagnostic Passed' : 'Diagnostic Notice'}</div>
                <div className="text-xs leading-relaxed">{diagnosticResult.message}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Operational Cities</span>
                  <span className="font-bold text-[#FAF8F5] text-lg">{diagnosticResult.citiesCount || 0}</span>
                </div>
                <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Merchant Pickup Addresses</span>
                  <span className="font-bold text-[#FAF8F5] text-lg">{diagnosticResult.addressesCount || 0}</span>
                </div>
                <div className="bg-[#06191B] p-4 rounded-xl border border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase block">Environment</span>
                  <span className="font-bold text-emerald-400 text-lg">{diagnosticResult.environment || 'TEST'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-[#06191B] rounded-2xl border border-[#D4AF37]/15">
              <ShieldCheck className="w-8 h-8 text-[#D4AF37]/60 mx-auto mb-2" />
              <div className="text-sm font-semibold text-[#FAF8F5]">Ready to run live API diagnostic</div>
              <p className="text-xs text-[#FAF8F5]/60 mt-1">Click &quot;Run Live Diagnostic&quot; above to inspect your merchant token.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
