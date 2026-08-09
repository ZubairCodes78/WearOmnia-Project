import React from 'react';
import { prisma } from '@/lib/prisma';
import { PrintControls } from '@/components/admin/PrintControls';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface PrintInvoiceProps {
  params: Promise<{ id: string }>;
}

export default async function PrintInvoicePage({ params }: PrintInvoiceProps) {
  let id = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
  } catch (e) {
    id = '';
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-xs text-gray-600">The requested order ID is missing.</p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  let order = null;
  let loadError = false;

  try {
    order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  } catch (e) {
    console.error('Failed to load order invoice:', e);
    loadError = true;
  }

  if (loadError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-gray-900">
            {loadError ? 'Unable to load this order' : 'Order Not Found'}
          </h2>
          <p className="text-xs text-gray-600">
            {loadError ? 'Unable to load this order. Please try again.' : 'Order not found.'}
          </p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans max-w-4xl mx-auto">
      {/* Print Controls (Client Component) */}
      <PrintControls
        title="WearOMNIA Invoice Printer"
        subtitle="Tax invoice for customer record"
        buttonLabel="Print Invoice Now"
      />

      {/* Invoice Document Header */}
      <div className="border-b-2 border-teal-900 pb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl font-bold uppercase tracking-tight text-teal-900">WearOMNIA</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-sans">
            Haute Couture Atelier • Lahore, Pakistan
          </p>
        </div>
        <div className="text-right text-xs">
          <span className="font-serif text-xl font-bold block text-teal-900">TAX INVOICE</span>
          <p className="font-mono font-bold">#{order.orderNumber}</p>
          <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer & Atelier Info */}
      <div className="grid grid-cols-2 gap-8 my-8 text-xs">
        <div>
          <h3 className="font-serif font-bold uppercase text-teal-900 mb-1">Billed & Shipped To:</h3>
          <p className="font-bold text-sm">{order.customerName || 'N/A'}</p>
          <p>{order.shippingAddress || 'N/A'}</p>
          <p>{order.shippingCity || ''}{order.shippingProvince ? `, ${order.shippingProvince}` : ''}</p>
          <p className="mt-1 font-mono">Mobile: {order.customerPhone || 'N/A'}</p>
        </div>

        <div className="text-right">
          <h3 className="font-serif font-bold uppercase text-teal-900 mb-1">Dispatched From:</h3>
          <p className="font-bold">WearOMNIA Flagship Atelier</p>
          <p>Lahore, Pakistan</p>
          <p className="mt-1 font-semibold text-teal-950">Payment Method: CASH ON DELIVERY (COD)</p>
          {order.courier && (
            <p className="font-semibold text-teal-950">Courier: {order.courier}</p>
          )}
          {order.trackingNumber && (
            <p className="font-mono font-semibold">Tracking: {order.trackingNumber}</p>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-left text-xs border-collapse my-8">
        <thead>
          <tr className="border-b-2 border-teal-900 text-teal-900 uppercase font-bold">
            <th className="py-3">Item Description</th>
            <th className="py-3 text-center">Qty</th>
            <th className="py-3 text-right">Unit Price (PKR)</th>
            <th className="py-3 text-right">Total (PKR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  <span className="font-bold text-sm block">{item.productTitle}</span>
                  <span className="text-gray-600 text-[11px]">{item.variantInfo || 'Standard'}</span>
                </td>
                <td className="py-3 text-center font-bold">{item.quantity}</td>
                <td className="py-3 text-right font-mono">Rs. {(item.unitPrice ?? 0).toLocaleString()}</td>
                <td className="py-3 text-right font-mono font-bold">Rs. {(item.subtotal ?? 0).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500 italic">No items listed</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="flex justify-end my-8 text-xs">
        <div className="w-64 space-y-2 border-t border-gray-300 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-mono">Rs. {(order.subtotal ?? 0).toLocaleString()}</span>
          </div>
          {(order.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between font-semibold text-teal-900">
              <span>Discount:</span>
              <span className="font-mono">- Rs. {(order.discountAmount ?? 0).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping Fee:</span>
            <span className="font-mono">{order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-teal-900 border-t-2 border-teal-900 pt-2">
            <span>Total Payable COD:</span>
            <span className="font-mono">Rs. {(order.totalAmount ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Terms Footer */}
      <div className="border-t border-gray-300 pt-6 text-[10px] text-gray-600 text-center space-y-1">
        <p className="font-bold uppercase tracking-wider text-teal-900">Thank you for shopping with WearOMNIA</p>
        <p>
          For exchange assistance, contact our WhatsApp Concierge: 03180633323 • Email: wearomniaa@gmail.com • 7-Day Exchange Policy
        </p>
      </div>
    </div>
  );
}
