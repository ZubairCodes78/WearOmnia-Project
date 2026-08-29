'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Printer, Download, Eye, FileText, Truck, Package, Trash2 } from 'lucide-react';
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

interface OrderTimeline {
  id: string;
  status: string;
  note: string | null;
  updatedBy: string;
  createdAt: Date;
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
  paymentMethod: string;
  status: string;
  trackingNumber: string | null;
  courier: string | null;
  couponCode: string | null;
  createdAt: Date;
  items: OrderItem[];
  timeline?: OrderTimeline[];
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
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);

  // Real-Time SSE Stream for Instant Admin Order Updates
  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/admin/events/sse');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_AUTO_CONFIRMED' && data.order) {
            setOrders((prev) =>
              prev.map((o) => (o.id === data.order.id ? { ...o, status: 'CONFIRMED', updatedAt: new Date() } : o))
            );
          } else if (data.type === 'NEW_ORDER' && data.order) {
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
    } catch (e) {
      console.warn('SSE fallback');
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.shippingCity.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      o.trackingNumber || '',
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
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A2528]/80 backdrop-blur-xl p-6 rounded-3xl border border-champagne/20 shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-champagne absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search Order #, Phone, Name, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#06191B] rounded-xl text-xs text-offwhite border border-champagne/20 focus:outline-none focus:ring-1 focus:ring-champagne font-sans"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#06191B] rounded-xl text-xs text-champagne border border-champagne/20 focus:outline-none font-bold uppercase tracking-wider"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Call</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKING">Packing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>

          <button
            onClick={exportCSV}
            className="bg-champagne text-teal-950 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-offwhite transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-4 h-4" /> CSV Export
          </button>
        </div>
      </div>

      {/* Orders Table or Empty State */}
      <div className="bg-[#0A2528]/70 backdrop-blur-xl rounded-3xl border border-champagne/20 shadow-xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-teal-900/60 text-champagne flex items-center justify-center mx-auto border border-champagne/30">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-champagne">No Orders Yet</h3>
            <p className="text-xs text-offwhite/60 max-w-sm mx-auto font-sans">
              As soon as a customer places a Cash On Delivery order, it will instantly stream here via Server-Sent Events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06191B] text-champagne uppercase tracking-wider font-semibold border-b border-champagne/20">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Courier / Tracking</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne/10">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#103A3E]/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-champagne">{order.orderNumber}</td>
                    <td className="p-4 text-offwhite/70 font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-offwhite block">{order.customerName}</span>
                      <span className="text-offwhite/60 text-[11px] font-mono">{order.customerPhone}</span>
                    </td>
                    <td className="p-4 text-offwhite/80">{order.shippingCity}</td>
                    <td className="p-4 font-bold text-champagne text-sm">
                      Rs. {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-4">
                      {order.courier || order.trackingNumber ? (
                        <div className="space-y-0.5">
                          {order.courier && (
                            <span className="bg-teal-800 text-champagne px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              {order.courier}
                            </span>
                          )}
                          {order.trackingNumber && (
                            <p className="text-[10px] text-offwhite/60 font-mono">{order.trackingNumber}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-offwhite/30 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="bg-teal-900/80 text-champagne px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] hover:bg-champagne hover:text-teal-950 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </Link>

                      <button
                        onClick={() => {
                          const cleanPhone = normalizePhone(order.customerPhone);
                          const msg = encodeURIComponent(`Hi ${order.customerName},\nRegarding your WearOMNIA order #${order.orderNumber}.`);
                          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                        }}
                        className="bg-emerald-600/90 text-white px-2.5 py-1.5 rounded-lg font-semibold text-[10px] hover:bg-emerald-500 transition-colors inline-flex items-center gap-1"
                        title="Send Direct WhatsApp Message"
                      >
                        WhatsApp
                      </button>

                      <Link
                        href={`/admin/orders/${order.id}/label`}
                        target="_blank"
                        className="bg-champagne text-teal-950 px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] hover:bg-offwhite transition-colors inline-flex items-center gap-1"
                        title="Print Official PostEx Airway Bill PDF"
                      >
                        <Printer className="w-3 h-3" /> Official AWB
                      </Link>

                      <button
                        onClick={() => setSelectedOrderForDelete(order)}
                        className="bg-red-950/60 hover:bg-red-900/90 text-red-300 border border-red-800/50 px-2.5 py-1.5 rounded-lg font-bold uppercase text-[10px] transition-colors inline-flex items-center gap-1"
                        title="Permanently Delete Order"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteOrderModal
        isOpen={Boolean(selectedOrderForDelete)}
        onClose={() => setSelectedOrderForDelete(null)}
        onConfirm={handleDeleteOrder}
        order={selectedOrderForDelete}
      />
    </div>
  );
}
