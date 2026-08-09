import React from 'react';
import { prisma } from '@/lib/prisma';
import { PrintControls } from '@/components/admin/PrintControls';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface PrintPackingSlipProps {
  params: Promise<{ id: string }>;
}

export default async function PrintPackingSlipPage({ params }: PrintPackingSlipProps) {
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
    console.error('Failed to load packing slip:', e);
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
    <div className="bg-white min-h-screen p-8 text-black font-sans max-w-2xl mx-auto border-2 border-black m-4">
      {/* Print Action (Client Component) */}
      <PrintControls
        title="Courier Packing Slip"
        subtitle="Internal packing manifest"
        buttonLabel="Print Packing Slip"
      />

      <div className="border-b-2 border-black pb-4 text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold uppercase tracking-tight">WearOMNIA</h1>
        <p className="text-xs uppercase font-bold tracking-widest">CASH ON DELIVERY PACKING SLIP</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b-2 border-black py-4 text-xs">
        <div>
          <span className="font-bold uppercase block text-gray-600">Order Number:</span>
          <span className="font-mono text-xl font-bold">#{order.orderNumber || 'N/A'}</span>
        </div>
        <div className="text-right">
          <span className="font-bold uppercase block text-gray-600">COD Collectable Amount:</span>
          <span className="font-mono text-2xl font-bold text-red-700">Rs. {(order.totalAmount ?? 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="py-4 border-b-2 border-black space-y-1 text-xs">
        <span className="font-bold uppercase block text-gray-600">DESTINATION RECIPIENT:</span>
        <p className="font-bold text-base">{order.customerName || 'N/A'}</p>
        <p className="text-sm font-semibold">{order.shippingAddress || 'N/A'}</p>
        <p className="font-bold text-base uppercase">{order.shippingCity || ''}{order.shippingProvince ? `, ${order.shippingProvince}` : ''}</p>
        <p className="font-mono font-bold text-sm">MOBILE: {order.customerPhone || 'N/A'}</p>
      </div>

      <div className="py-4 border-b-2 border-black space-y-2 text-xs">
        <span className="font-bold uppercase block text-gray-600">PACKAGE CONTENT MANIFEST:</span>
        {order.items && order.items.length > 0 ? (
          order.items.map((i) => (
            <div key={i.id} className="flex justify-between font-mono">
              <span>{i.productTitle} {i.variantInfo ? `(${i.variantInfo})` : ''}</span>
              <span className="font-bold">Qty: {i.quantity}</span>
            </div>
          ))
        ) : (
          <p className="italic text-gray-500">No items listed</p>
        )}
      </div>

      <div className="pt-4 text-center text-[10px] uppercase font-mono font-bold">
        DISPATCHED BY WEAROMNIA LAHORE ATELIER • TEL: 03180633323 • EMAIL: wearomniaa@gmail.com
      </div>
    </div>
  );
}
