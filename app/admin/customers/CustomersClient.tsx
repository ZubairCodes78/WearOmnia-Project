'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Crown,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  Sparkles,
  TrendingUp,
  X,
  Save,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  totalSpent: number;
  ordersCount: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  customerNotes: string | null;
  isVIP: boolean;
  orders: CustomerOrder[];
}

interface CustomersClientProps {
  initialCustomers: Customer[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState<'ALL' | 'VIP' | 'REGULAR'>('ALL');

  // Drawer / Detail State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipCount = customers.filter((c) => c.isVIP).length;
  const repeatBuyersCount = customers.filter((c) => c.ordersCount > 1).length;
  const avgLifetimeValue = customers.length > 0 ? Math.round(totalSpentAll / customers.length) : 0;

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      c.fullName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term));

    let matchesVip = true;
    if (vipFilter === 'VIP') matchesVip = c.isVIP;
    else if (vipFilter === 'REGULAR') matchesVip = !c.isVIP;

    return matchesSearch && matchesVip;
  });

  const handleToggleVIP = async (customer: Customer) => {
    const newVip = !customer.isVIP;
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, isVIP: newVip }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isVIP: newVip } : c))
        );
        if (selectedCustomer?.id === customer.id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, isVIP: newVip } : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNotes(customer.customerNotes || '');
    setSaveMessage('');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomer.id, customerNotes: notes }),
      });
      if (res.ok) {
        setSaveMessage('Notes saved successfully.');
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? { ...c, customerNotes: notes } : c))
        );
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch {
      setSaveMessage('Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-8 text-[#FAF8F5]">
      {/* Header */}
      <div className="bg-[#0A2528]/85 backdrop-blur-2xl p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-teal-950/80 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
              <Users className="w-3 h-3 text-[#D4AF37]" /> Clientele Intelligence
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#FAF8F5] mt-2">
            Consolidated Customer Profiles
          </h1>
          <p className="text-xs text-[#FAF8F5]/70 mt-1 font-sans">
            Unified customer profiles linked by phone number, lifetime purchase history, VIP tagging, and loyalty metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="bg-[#D4AF37] text-black hover:bg-white px-5 py-2.5 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all shadow-lg flex items-center gap-2"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Total Customer Base</span>
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-[#FAF8F5]">{customers.length}</p>
          <span className="text-[11px] text-[#FAF8F5]/60 font-semibold">Verified Contact Profiles</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">VIP Clientele</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-amber-400">{vipCount}</p>
          <span className="text-[11px] text-amber-300 font-semibold">High-Value Brand Patrons</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Repeat Buyers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-emerald-400">{repeatBuyersCount}</p>
          <span className="text-[11px] text-emerald-300/80 font-semibold">Multiple Nationwide Orders</span>
        </div>

        <div className="bg-[#0A2528]/70 backdrop-blur-md p-6 rounded-2xl border border-[#D4AF37]/20 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">Avg. Lifetime Spend</span>
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-[#FAF8F5]">Rs. {avgLifetimeValue.toLocaleString()}</p>
          <span className="text-[11px] text-[#FAF8F5]/60 font-semibold">Per Customer Lifetime Value</span>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#D4AF37]/20 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVipFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              vipFilter === 'ALL' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            onClick={() => setVipFilter('VIP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              vipFilter === 'VIP' ? 'bg-amber-500 text-black shadow' : 'bg-[#06191B] text-amber-300 hover:text-white'
            }`}
          >
            VIP Patrons ({vipCount})
          </button>
          <button
            onClick={() => setVipFilter('REGULAR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              vipFilter === 'REGULAR' ? 'bg-[#D4AF37] text-black shadow' : 'bg-[#06191B] text-[#FAF8F5]/80 hover:text-[#D4AF37]'
            }`}
          >
            Standard Clientele
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Customer Name, Phone, City, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#0A2528]/80 backdrop-blur-2xl rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#D4AF37] uppercase tracking-wider font-semibold border-b border-[#D4AF37]/15">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone / WhatsApp</th>
                <th className="p-4">City / Region</th>
                <th className="p-4">Orders Count</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">VIP Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#FAF8F5]/50 italic">
                    No customer profiles found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#103A3E]/40 transition-colors">
                    <td className="p-4">
                      <button
                        onClick={() => handleOpenCustomer(customer)}
                        className="font-serif font-bold text-[#FAF8F5] text-sm text-left hover:text-[#D4AF37] hover:underline block"
                      >
                        {customer.fullName}
                      </button>
                      <span className="text-[11px] text-[#FAF8F5]/60">{customer.email || 'No email recorded'}</span>
                    </td>
                    <td className="p-4 font-mono text-[#D4AF37] font-semibold">{customer.phone}</td>
                    <td className="p-4 text-[#FAF8F5]">{customer.city || customer.province || 'Pakistan'}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{customer.ordersCount} Orders</td>
                    <td className="p-4 font-mono font-bold text-[#D4AF37]">
                      Rs. {customer.totalSpent.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleVIP(customer)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1 w-fit ${
                          customer.isVIP
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-[#06191B] text-[#FAF8F5]/60 border-white/10 hover:border-[#D4AF37]'
                        }`}
                      >
                        <Crown className={`w-3 h-3 ${customer.isVIP ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
                        {customer.isVIP ? 'VIP Patron' : 'Set VIP'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenCustomer(customer)}
                        className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border border-[#D4AF37]/30"
                      >
                        Profile →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Orders Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">
                    {selectedCustomer.fullName}
                  </h3>
                  {selectedCustomer.isVIP && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 font-sans">
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#D4AF37] font-mono mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#06191B] p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">Lifetime Orders</span>
                <span className="font-serif text-xl font-bold text-[#FAF8F5]">{selectedCustomer.ordersCount}</span>
              </div>
              <div className="bg-[#06191B] p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">Total Spend</span>
                <span className="font-serif text-xl font-bold text-emerald-400">Rs. {selectedCustomer.totalSpent.toLocaleString()}</span>
              </div>
              <div className="bg-[#06191B] p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">AOV</span>
                <span className="font-serif text-xl font-bold text-[#D4AF37]">
                  Rs. {selectedCustomer.ordersCount > 0 ? Math.round(selectedCustomer.totalSpent / selectedCustomer.ordersCount).toLocaleString() : '0'}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-[#06191B] p-4 rounded-2xl border border-[#D4AF37]/15 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">Delivery Information</span>
              <p className="text-[#FAF8F5]">{selectedCustomer.address || 'Standard Address Recorded on Order'}</p>
              <p className="text-[#FAF8F5]/70">{selectedCustomer.city || ''} {selectedCustomer.province ? `, ${selectedCustomer.province}` : ''}</p>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block">
                Recent Orders ({selectedCustomer.orders?.length || 0})
              </span>
              <div className="space-y-2">
                {selectedCustomer.orders?.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#06191B] p-3.5 rounded-xl border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#D4AF37]">{ord.orderNumber}</span>
                      <span className="text-[10px] text-[#FAF8F5]/50 block">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#FAF8F5]">Rs. {ord.totalAmount.toLocaleString()}</span>
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        target="_blank"
                        className="p-1.5 bg-[#0D3337] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-lg transition-colors"
                        title="Open Order Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Customer Notes */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-xs font-bold text-[#D4AF37] uppercase">Internal Admin Customer Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add VIP preferences, preferred delivery instructions, customer sizing..."
                className="w-full bg-[#06191B] border border-[#D4AF37]/30 rounded-xl p-3 text-xs text-[#FAF8F5] focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-[#D4AF37] hover:bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Notes
                </button>
                {saveMessage && (
                  <span className="text-xs text-emerald-400 font-semibold">{saveMessage}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
