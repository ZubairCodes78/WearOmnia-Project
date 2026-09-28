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
  CreditCard,
  TrendingUp,
  X,
  Save,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
  const debouncedSearch = useDebounce(search, 300);
  const [vipFilter, setVipFilter] = useState<'ALL' | 'VIP' | 'REGULAR'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Drawer / Detail State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteCustomerModal, setDeleteCustomerModal] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleDeleteCustomerConfirm = async () => {
    if (!deleteCustomerModal) return;
    const res = await fetch('/api/admin/customers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: deleteCustomerModal.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete customer.');
    }

    setCustomers((prev) => prev.filter((c) => c.id !== deleteCustomerModal.id));
    if (selectedCustomer?.id === deleteCustomerModal.id) {
      setSelectedCustomer(null);
    }
    setDeleteCustomerModal(null);
    router.refresh();
  };

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipCount = customers.filter((c) => c.isVIP).length;
  const repeatBuyersCount = customers.filter((c) => c.ordersCount > 1).length;
  const avgLifetimeValue = customers.length > 0 ? Math.round(totalSpentAll / customers.length) : 0;

  const filteredCustomers = customers.filter((c) => {
    const term = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      c.fullName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term));

    let matchesVip = true;
    if (vipFilter === 'VIP') matchesVip = c.isVIP;
    else if (vipFilter === 'REGULAR') matchesVip = !c.isVIP;

    return matchesSearch && matchesVip;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 on filter/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, vipFilter]);

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
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Customer Intelligence"
        description="Unified customer profiles linked by phone number, lifetime purchase history, VIP status, and loyalty metrics."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" /> Clientele Intelligence
          </span>
        }
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#c49f2f] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            View Orders
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A2528] rounded-xl border border-white/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#D4AF37]">Total Customer Base</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5] mt-2">{customers.length}</p>
          <span className="text-[11px] text-[#FAF8F5]/50 mt-1 block">Verified contact profiles</span>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-amber-500/20 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-amber-400">VIP Clientele</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-amber-400 mt-2">{vipCount}</p>
          <span className="text-[11px] text-amber-300/70 mt-1 block">High-value brand patrons</span>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-emerald-500/20 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400">Repeat Buyers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-emerald-400 mt-2">{repeatBuyersCount}</p>
          <span className="text-[11px] text-emerald-300/70 mt-1 block">Multiple orders placed</span>
        </div>

        <div className="bg-[#0A2528] rounded-xl border border-white/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#D4AF37]">Avg. Lifetime Spend</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#FAF8F5] mt-2">Rs. {avgLifetimeValue.toLocaleString()}</p>
          <span className="text-[11px] text-[#FAF8F5]/50 mt-1 block">Average customer value</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setVipFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              vipFilter === 'ALL'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            onClick={() => setVipFilter('VIP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              vipFilter === 'VIP'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Crown className="w-3 h-3" />
            VIP Patrons ({vipCount})
          </button>
          <button
            onClick={() => setVipFilter('REGULAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
              vipFilter === 'REGULAR'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-[#FAF8F5]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Standard ({customers.length - vipCount})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#FAF8F5]/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#06191B] rounded-lg text-xs text-[#FAF8F5] border border-white/10 focus:outline-none focus:border-[#D4AF37]/50 font-sans placeholder:text-[#FAF8F5]/30 transition-colors"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#0A2528] rounded-xl border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#06191B] text-[#FAF8F5]/60 border-b border-white/5 font-semibold">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">VIP Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      icon={Users}
                      title="No customers found"
                      description="No customer profiles match your current search or filter criteria."
                      action={
                        search || vipFilter !== 'ALL'
                          ? {
                              label: 'Clear Filters',
                              onClick: () => {
                                setSearch('');
                                setVipFilter('ALL');
                              },
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenCustomer(customer)}
                        className="font-medium text-[#FAF8F5] text-left hover:text-[#D4AF37] hover:underline block"
                      >
                        {customer.fullName}
                      </button>
                      <span className="text-[11px] text-[#FAF8F5]/40">{customer.email || 'No email recorded'}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#D4AF37] text-xs">{customer.phone}</td>
                    <td className="px-4 py-3 text-[#FAF8F5]/70">{customer.city || customer.province || 'Pakistan'}</td>
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">{customer.ordersCount} Orders</td>
                    <td className="px-4 py-3 font-mono font-medium text-[#D4AF37]">
                      Rs. {customer.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVIP(customer)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider transition-all border flex items-center gap-1.5 w-fit ${
                          customer.isVIP
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-[#06191B] text-[#FAF8F5]/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Crown className={`w-3 h-3 ${customer.isVIP ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
                        {customer.isVIP ? 'VIP Patron' : 'Standard'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenCustomer(customer)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/10 text-[#FAF8F5]/80 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => setDeleteCustomerModal(customer)}
                          className="p-1 rounded-md border border-white/10 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title="Delete Customer Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Customer Profile & Orders Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A2528] text-[#FAF8F5] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">{selectedCustomer.fullName}</h3>
                  {selectedCustomer.isVIP && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#FAF8F5]/60 mt-0.5">{selectedCustomer.phone} • {selectedCustomer.email || 'No email'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteCustomerModal(selectedCustomer)}
                  className="bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 px-3 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete Profile
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-[#D4AF37] hover:bg-teal-900 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Financial Snapshot */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#06191B] p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="text-[10px] uppercase text-[#D4AF37] font-bold block">Orders Placed</span>
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

      {/* Delete Customer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteCustomerModal)}
        onClose={() => setDeleteCustomerModal(null)}
        onConfirm={handleDeleteCustomerConfirm}
        title="Delete Customer Profile?"
        itemName={`${deleteCustomerModal?.fullName} (${deleteCustomerModal?.phone})`}
        itemType="Customer Profile"
        warningMessage="This will permanently delete this customer profile from the Customer Base. Any past order records will be safely unlinked rather than deleted, preserving financial and revenue accounting."
      />
    </div>
  );
}
