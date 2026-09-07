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
    <div className="admin-page text-[#FAF8F5]">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="space-y-1 w-full md:w-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Live Sales Pipeline</p>
          <h1 className="font-serif text-2xl font-bold text-[#FAF8F5]">
            Customer Orders & Shipments ({filteredOrders.length})
          </h1>
          <p className="text-xs text-[#FAF8F5]/60 font-sans">
            Real-time feed of all Cash On Delivery and online orders with direct courier sync.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by Order #, phone, name, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#06191B] rounded-xl text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 border border-[#D4AF37]/25 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#06191B] rounded-xl text-xs text-[#D4AF37] border border-[#D4AF37]/30 focus:outline-none font-bold uppercase tracking-wider"
          >
            <option value="ALL">All Statuses</option>
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
            className="w-full sm:w-auto bg-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 btn-3d"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Orders Table or Empty State */}
      <div className="admin-table-wrapper admin-card-3d">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-900/60 text-[#D4AF37] flex items-center justify-center mx-auto border border-[#D4AF37]/30 shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#FAF8F5]">No Orders Found</h3>
            <p className="text-xs text-[#FAF8F5]/60 max-w-sm mx-auto font-sans">
              As soon as a customer places an order, it will instantly stream here live.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Courier / Tracking</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="p-4 font-mono font-bold text-[#D4AF37]">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-[#FAF8F5]/70 font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-[#FAF8F5] block">{order.customerName}</span>
                      <span className="text-[#FAF8F5]/60 text-[11px] font-mono">{order.customerPhone}</span>
                    </td>
                    <td className="p-4 text-[#FAF8F5]/80 font-medium">{order.shippingCity}</td>
                    <td className="p-4 font-bold font-mono text-[#D4AF37] text-sm">
                      Rs. {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-4">
                      {order.courier || order.trackingNumber ? (
                        <div className="space-y-0.5">
                          {order.courier && (
                            <span className="bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block">
                              {order.courier}
                            </span>
                          )}
                          {order.trackingNumber && (
                            <p className="text-[10px] text-[#FAF8F5]/70 font-mono">{order.trackingNumber}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#FAF8F5]/30 text-[10px]">—</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-action-group">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="admin-btn bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black shadow-sm"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Link>

                        <button
                          onClick={() => {
                            const cleanPhone = normalizePhone(order.customerPhone);
                            const msg = encodeURIComponent(`Hi ${order.customerName},\nRegarding your WearOMNIA order #${order.orderNumber}.`);
                            window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                          }}
                          className="admin-btn bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          title="Send Direct WhatsApp Message"
                        >
                          WhatsApp
                        </button>

                        <Link
                          href={`/admin/orders/${order.id}/label`}
                          target="_blank"
                          className="admin-btn bg-[#D4AF37] text-black hover:bg-white shadow-sm"
                          title="Print Courier Shipping Label PDF"
                        >
                          <Printer className="w-3 h-3" /> Label
                        </Link>

                        <button
                          onClick={() => setSelectedOrderForDelete(order)}
                          className="admin-btn bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 shadow-sm"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" /> Delete
                        </button>
                      </div>
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
