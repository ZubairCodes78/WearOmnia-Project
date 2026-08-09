import React from 'react';
import { prisma } from '@/lib/prisma';
import { generateSVGBarcode, generateSVGQRCode } from '@/lib/barcode';
import { PrintControls } from '@/components/admin/PrintControls';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface ShippingLabelProps {
  params: Promise<{ id: string }>;
}

export default async function ShippingLabelPage({ params }: ShippingLabelProps) {
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
          <p className="text-xs text-gray-600">The requested order identification is missing or invalid.</p>
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
      include: {
        items: true,
        shipments: { orderBy: { createdAt: 'desc' } },
      },
    });
  } catch (e) {
    console.error('Failed to query order for shipping label:', e);
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-gray-900">Unable to load this order</h2>
          <p className="text-xs text-gray-600">Unable to load this order. Please try again.</p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase">
            <ArrowLeft className="w-4 h-4" /> Return to Admin Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-xs text-gray-600">Order not found.</p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase">
            <ArrowLeft className="w-4 h-4" /> Return to Orders List
          </Link>
        </div>
      </div>
    );
  }

  // Check for incomplete fields
  const isMissingInfo =
    !order.customerName ||
    !order.customerPhone ||
    !order.shippingAddress ||
    !order.shippingCity ||
    !order.items ||
    order.items.length === 0;

  const activeShipment = order.shipments && order.shipments.length > 0 ? order.shipments[0] : null;
  const trackingId = activeShipment?.trackingNumber || order.trackingNumber || 'PENDING';
  const courierName = activeShipment?.provider === 'POSTEX' ? 'PostEx Courier' : (order.courier || 'PostEx Express');

  const barcodeSvg = generateSVGBarcode(order.orderNumber || 'OMNIA-00000');
  const qrSvg = generateSVGQRCode(`https://wearomnia.com/order-success/${order.orderNumber || ''}`);

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 text-black font-sans">
      {/* Print Controls (Client Component) */}
      <PrintControls
        title="A4 / A6 Courier Delivery Label"
        subtitle="Printable on standard thermal label or A4 paper"
        buttonLabel="Print Label"
      />

      {/* Warning Notice if info is missing */}
      {isMissingInfo && (
        <div className="no-print max-w-md mx-auto mb-4 bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Some order information is missing. Please verify shipping details.</span>
        </div>
      )}

      {/* Shipping Label Container (Formatted for A6 Thermal or A4 Sheet) */}
      <div className="max-w-md mx-auto border-4 border-black p-6 bg-white space-y-4 shadow-2xl">
        {/* Label Header */}
        <div className="border-b-4 border-black pb-4 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold uppercase tracking-tight">WearOMNIA</h1>
            <span className="text-[9px] uppercase tracking-widest block font-mono font-bold">
              EXPRESS COD DISPATCH
            </span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>

        {/* Order Identifier & Barcode */}
        <div className="border-b-2 border-black pb-3 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-600 block">ORDER IDENTIFIER</span>
          <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        </div>

        {/* COD Amount Box */}
        <div className="bg-black text-white p-3 rounded-lg text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
            CASH ON DELIVERY (COLLECT IN FULL)
          </span>
          <span className="font-serif text-3xl font-bold text-white block mt-0.5">
            Rs. {(order.totalAmount ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Courier & Tracking Section */}
        <div className="border-2 border-dashed border-black p-2.5 rounded text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] uppercase font-bold text-gray-500">COURIER:</span>
            <span className="font-bold text-sm uppercase">{courierName}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] uppercase font-bold text-gray-500">TRACKING ID:</span>
            <span className="font-mono font-bold text-sm">{trackingId}</span>
          </div>
        </div>

        {/* Recipient Details */}
        <div className="border-b-2 border-black pb-4 space-y-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase text-gray-500 block">SHIP TO RECIPIENT:</span>
          <p className="font-bold text-base uppercase text-black">{order.customerName || 'N/A'}</p>
          <p className="font-semibold leading-snug">{order.shippingAddress || 'N/A'}</p>
          <p className="font-bold text-sm uppercase text-black">
            {order.shippingCity || ''}{order.shippingProvince ? `, ${order.shippingProvince}` : ''} {order.postalCode || ''}
          </p>
          <div className="bg-gray-100 p-2 rounded border border-black mt-2 font-mono font-bold text-sm">
            MOBILE: {order.customerPhone || 'N/A'}
          </div>
        </div>

        {/* Package Contents Manifest */}
        <div className="border-b-2 border-black pb-3 space-y-1 text-[11px]">
          <span className="font-bold uppercase text-gray-500 block text-[9px]">PACKAGE CONTENTS:</span>
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <div key={item.id} className="flex justify-between font-mono">
                <span className="truncate max-w-[220px]">
                  {item.productTitle} {item.variantInfo ? `(${item.variantInfo})` : ''}
                </span>
                <span className="font-bold">Qty: {item.quantity}</span>
              </div>
            ))
          ) : (
            <p className="italic text-gray-500 text-[10px]">No items listed in order</p>
          )}
        </div>

        {/* Origin Atelier Info */}
        <div className="text-[9px] font-mono text-center space-y-0.5 text-gray-600">
          <p className="font-bold uppercase text-black">DISPATCHED FROM WEAROMNIA LAHORE ATELIER</p>
          <p>Lahore, Pakistan • Helpline: 03180633323 • wearomniaa@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
