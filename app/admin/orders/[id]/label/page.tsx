import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateSVGBarcode, generateSVGQRCode } from '@/lib/barcode';
import { Printer } from 'lucide-react';

interface ShippingLabelProps {
  params: Promise<{ id: string }>;
}

export default async function ShippingLabelPage({ params }: ShippingLabelProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const barcodeSvg = generateSVGBarcode(order.orderNumber);
  const qrSvg = generateSVGQRCode(`https://wearomnia.com/order-success/${order.orderNumber}`);

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 text-black font-sans">
      {/* Print Controls (Hidden in Print View) */}
      <div className="no-print mb-8 max-w-xl mx-auto flex items-center justify-between bg-gray-100 p-4 rounded-2xl border border-gray-200">
        <div>
          <h3 className="font-bold text-sm uppercase text-teal-950">A4 / A6 Courier Delivery Label</h3>
          <p className="text-[11px] text-gray-600">Printable on standard thermal or A4 paper</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Label
        </button>
      </div>

      {/* Shipping Label Box (Formatted for A6 thermal label or A4 sheet) */}
      <div className="max-w-md mx-auto border-4 border-black p-6 bg-white space-y-4 shadow-2xl">
        {/* Label Header */}
        <div className="border-b-4 border-black pb-4 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold uppercase tracking-tight">WearOMNIA</h1>
            <span className="text-[9px] uppercase tracking-widest block font-mono font-bold">EXPRESS COD DISPATCH</span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>

        {/* Order Number & Barcode */}
        <div className="border-b-2 border-black pb-3 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-600 block">ORDER IDENTIFIER</span>
          <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        </div>

        {/* COD Collectable Amount Box */}
        <div className="bg-black text-white p-3 rounded-lg text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
            CASH ON DELIVERY (COLLECT IN FULL)
          </span>
          <span className="font-serif text-3xl font-bold text-white block mt-0.5">
            Rs. {order.totalAmount.toLocaleString()}
          </span>
        </div>

        {/* Courier & Tracking Info */}
        {(order.courier || order.trackingNumber) && (
          <div className="border-2 border-dashed border-black p-2.5 rounded text-center space-y-1">
            {order.courier && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[9px] uppercase font-bold text-gray-500">COURIER:</span>
                <span className="font-bold text-sm uppercase">{order.courier}</span>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[9px] uppercase font-bold text-gray-500">TRACKING:</span>
                <span className="font-mono font-bold text-sm">{order.trackingNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* Recipient Details */}
        <div className="border-b-2 border-black pb-4 space-y-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase text-gray-500 block">SHIP TO RECIPIENT:</span>
          <p className="font-bold text-base uppercase text-black">{order.customerName}</p>
          <p className="font-semibold leading-snug">{order.shippingAddress}</p>
          <p className="font-bold text-sm uppercase text-black">
            {order.shippingCity}, {order.shippingProvince} {order.postalCode || ''}
          </p>
          <div className="bg-gray-100 p-2 rounded border border-black mt-2 font-mono font-bold text-sm">
            MOBILE: {order.customerPhone}
          </div>
        </div>

        {/* Contents Manifest */}
        <div className="border-b-2 border-black pb-3 space-y-1 text-[11px]">
          <span className="font-bold uppercase text-gray-500 block text-[9px]">PACKAGE CONTENTS:</span>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between font-mono">
              <span className="truncate max-w-[220px]">{item.productTitle}</span>
              <span className="font-bold">Qty: {item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Origin Atelier Info */}
        <div className="text-[9px] font-mono text-center space-y-0.5 text-gray-600">
          <p className="font-bold uppercase text-black">DISPATCHED FROM WEAROMNIA LAHORE ATELIER</p>
          <p>M.M. Alam Road, Gulberg III, Lahore • Helpline: +92 300 1234567</p>
        </div>
      </div>
    </div>
  );
}
