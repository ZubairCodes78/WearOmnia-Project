import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Printer } from 'lucide-react';

interface PrintPackingSlipProps {
  params: Promise<{ id: string }>;
}

export default async function PrintPackingSlipPage({ params }: PrintPackingSlipProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans max-w-2xl mx-auto border-2 border-black m-4">
      {/* Print Action */}
      <div className="no-print mb-6 flex justify-between items-center bg-gray-100 p-4 rounded">
        <span className="text-xs font-bold uppercase">Courier Packing Slip</span>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-4 py-2 text-xs font-bold uppercase"
        >
          Print Packing Slip
        </button>
      </div>

      <div className="border-b-2 border-black pb-4 text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold uppercase tracking-tight">WearOMNIA</h1>
        <p className="text-xs uppercase font-bold tracking-widest">CASH ON DELIVERY PACKING SLIP</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b-2 border-black py-4 text-xs">
        <div>
          <span className="font-bold uppercase block text-gray-600">Order Number:</span>
          <span className="font-mono text-xl font-bold">#{order.orderNumber}</span>
        </div>
        <div className="text-right">
          <span className="font-bold uppercase block text-gray-600">COD Collectable Amount:</span>
          <span className="font-mono text-2xl font-bold text-red-700">Rs. {order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="py-4 border-b-2 border-black space-y-1 text-xs">
        <span className="font-bold uppercase block text-gray-600">DESTINATION RECIPIENT:</span>
        <p className="font-bold text-base">{order.customerName}</p>
        <p className="text-sm font-semibold">{order.shippingAddress}</p>
        <p className="font-bold text-base uppercase">{order.shippingCity}, {order.shippingProvince}</p>
        <p className="font-mono font-bold text-sm">MOBILE: {order.customerPhone}</p>
      </div>

      <div className="py-4 border-b-2 border-black space-y-2 text-xs">
        <span className="font-bold uppercase block text-gray-600">PACKAGE CONTENT MANIFEST:</span>
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between font-mono">
            <span>{i.productTitle} ({i.variantInfo})</span>
            <span className="font-bold">Qty: {i.quantity}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 text-center text-[10px] uppercase font-mono font-bold">
        DISPATCHED BY WEAROMNIA LAHORE ATELIER • TEL: +92 300 1234567
      </div>
    </div>
  );
}
