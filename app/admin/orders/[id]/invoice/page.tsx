import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Printer } from 'lucide-react';

interface PrintInvoiceProps {
  params: Promise<{ id: string }>;
}

export default async function PrintInvoicePage({ params }: PrintInvoiceProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans max-w-4xl mx-auto">
      {/* Print Trigger Button (Hidden in print preview) */}
      <div className="no-print mb-8 flex justify-between items-center bg-sand p-4 rounded-xl">
        <span className="text-xs font-bold uppercase text-teal">WearOMNIA Invoice Printer</span>
        <button
          onClick={() => window.print()}
          className="bg-teal text-champagne px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Invoice Now
        </button>
      </div>

      {/* Invoice Document Header */}
      <div className="border-b-2 border-teal-900 pb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl font-bold uppercase tracking-tight text-teal-900">WearOMNIA</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-sans">Haute Couture Atelier • Lahore, Pakistan</p>
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
          <p className="font-bold text-sm">{order.customerName}</p>
          <p>{order.shippingAddress}</p>
          <p>{order.shippingCity}, {order.shippingProvince}</p>
          <p className="mt-1 font-mono">Mobile: {order.customerPhone}</p>
        </div>

        <div className="text-right">
          <h3 className="font-serif font-bold uppercase text-teal-900 mb-1">Dispatched From:</h3>
          <p className="font-bold">WearOMNIA Flagship Atelier</p>
          <p>M.M. Alam Road, Gulberg III</p>
          <p>Lahore, Punjab, Pakistan</p>
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
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="py-3">
                <span className="font-bold text-sm block">{item.productTitle}</span>
                <span className="text-gray-600 text-[11px]">{item.variantInfo || 'Standard'}</span>
              </td>
              <td className="py-3 text-center font-bold">{item.quantity}</td>
              <td className="py-3 text-right font-mono">Rs. {item.unitPrice.toLocaleString()}</td>
              <td className="py-3 text-right font-mono font-bold">Rs. {item.subtotal.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="flex justify-end my-8 text-xs">
        <div className="w-64 space-y-2 border-t border-gray-300 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-mono">Rs. {order.subtotal.toLocaleString()}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between font-semibold text-teal-900">
              <span>Discount:</span>
              <span className="font-mono">- Rs. {order.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping Fee:</span>
            <span className="font-mono">{order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-teal-900 border-t-2 border-teal-900 pt-2">
            <span>Total Payable COD:</span>
            <span className="font-mono">Rs. {order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Terms Footer */}
      <div className="border-t border-gray-300 pt-6 text-[10px] text-gray-600 text-center space-y-1">
        <p className="font-bold uppercase tracking-wider text-teal-900">Thank you for shopping with WearOMNIA</p>
        <p>For exchange assistance, contact our WhatsApp Concierge: +92 300 1234567 • 7-Day Exchange Policy</p>
      </div>
    </div>
  );
}
