import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { postexApi } from '@/lib/courier/postex-api';
import {
  ArrowLeft,
  AlertTriangle,
  Printer,
  RefreshCw,
  FileText,
  ShieldCheck,
  Truck,
  ExternalLink,
} from 'lucide-react';

interface ShippingLabelProps {
  params: Promise<{ id: string }>;
}

export default async function OfficialPostExLabelPage({ params }: ShippingLabelProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#06191B] text-[#FAF8F5] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#0A2528] border border-red-500/30 p-8 rounded-3xl text-center max-w-md space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="font-serif text-xl font-bold">Unauthorized Access</h2>
          <p className="text-xs text-[#FAF8F5]/60">Admin authentication is required to access official PostEx labels.</p>
          <Link href="/admin/login" className="inline-block bg-[#D4AF37] text-black font-bold uppercase text-xs px-6 py-2.5 rounded-xl">
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shipments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-[#06191B] text-[#FAF8F5] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 p-8 rounded-3xl text-center max-w-md space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-[#D4AF37] mx-auto" />
          <h2 className="font-serif text-xl font-bold">Order Not Found</h2>
          <p className="text-xs text-[#FAF8F5]/60">The requested order could not be located in the system.</p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold uppercase text-xs px-6 py-2.5 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const activeShipment = order.shipments?.find(
    (s) => s.status !== 'FAILED' && s.status !== 'CANCELLED' && Boolean(s.trackingNumber)
  );

  const trackingNumber = activeShipment?.trackingNumber || order.trackingNumber;

  if (!trackingNumber) {
    return (
      <div className="min-h-screen bg-[#06191B] text-[#FAF8F5] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#0A2528] border border-amber-500/30 p-8 rounded-3xl text-center max-w-lg space-y-4 shadow-2xl">
          <Truck className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-amber-300">Shipment Not Yet Booked on PostEx</h2>
          <p className="text-xs text-[#FAF8F5]/70 leading-relaxed">
            Order <strong>#{order.orderNumber}</strong> has not yet been dispatched to PostEx. No fake or placeholder airway bill can be generated. Please dispatch the order from the Order Detail screen to obtain the official PostEx Airway Bill PDF.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold uppercase text-xs px-6 py-2.5 rounded-xl shadow-lg hover:bg-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Order Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Retrieve official PostEx PDF server-side
  const pdfRes = await postexApi.getInvoicePdf(trackingNumber);

  if (!pdfRes.success || !pdfRes.buffer) {
    return (
      <div className="min-h-screen bg-[#06191B] text-[#FAF8F5] flex items-center justify-center p-6 font-sans">
        <div className="bg-[#0A2528] border border-red-500/40 p-8 rounded-3xl text-center max-w-lg space-y-5 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <h2 className="font-serif text-xl font-bold text-red-300">Official PostEx PDF Retrieval Error</h2>
            <p className="text-xs text-[#FAF8F5]/60 mt-1 font-mono">Tracking #: {trackingNumber}</p>
          </div>
          <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-2xl text-xs text-red-200 text-left font-mono leading-relaxed">
            {pdfRes.message || 'PostEx API could not return the airway bill PDF for this tracking number.'}
          </div>
          <p className="text-[11px] text-[#FAF8F5]/50">
            PostEx may still be generating the PDF voucher or the tracking number was recently assigned. Do not generate a fake label.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={`/admin/orders/${order.id}/label`}
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold uppercase text-xs px-6 py-2.5 rounded-xl shadow-lg hover:bg-white transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry Retrieval
            </Link>
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-2 bg-[#103A3E] text-[#D4AF37] font-bold uppercase text-xs px-5 py-2.5 rounded-xl border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-all"
            >
              Back to Order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Convert binary buffer to base64 data URI for secure native PDF embedding
  const base64Pdf = Buffer.from(pdfRes.buffer).toString('base64');
  const pdfDataUri = `data:application/pdf;base64,${base64Pdf}`;
  const directPdfUrl = `/api/admin/courier/postex/label?trackingNumber=${encodeURIComponent(trackingNumber)}`;

  return (
    <div className="min-h-screen bg-[#06191B] flex flex-col font-sans text-[#FAF8F5]">
      {/* Top Action Header */}
      <header className="h-16 bg-[#0A2528] border-b border-[#D4AF37]/20 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xl print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/orders/${order.id}`}
            className="flex items-center gap-2 text-[#D4AF37] hover:text-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Order #{order.orderNumber}
          </Link>
          <span className="text-[#D4AF37]/30">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-[#FAF8F5] font-mono">
              Official PostEx AWB: {trackingNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={directPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Native PDF
          </a>
          <a
            href={directPdfUrl}
            download={`PostEx-AWB-${trackingNumber}.pdf`}
            className="bg-[#D4AF37] text-black hover:bg-[#FAF8F5] px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" /> Print Official AWB
          </a>
        </div>
      </header>

      {/* Embedded Official PostEx PDF Stream */}
      <main className="flex-1 w-full h-[calc(100vh-4rem)] bg-[#06191B] p-4 flex flex-col items-center">
        <iframe
          src={`${pdfDataUri}#toolbar=1&navpanes=0&scrollbar=1`}
          title={`Official PostEx Airway Bill - ${trackingNumber}`}
          className="w-full max-w-5xl flex-1 rounded-2xl border border-[#D4AF37]/30 shadow-2xl bg-white"
        />
      </main>
    </div>
  );
}
