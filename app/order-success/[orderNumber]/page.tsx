import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, Truck, Printer, ArrowRight, MessageSquare, ShieldCheck, MapPin, Package } from 'lucide-react';
import { OrderSuccessConfetti } from './OrderSuccessConfetti';
import { getSiteSettings } from '@/lib/settings';

interface OrderSuccessPageProps {
  params: Promise<{ orderNumber: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderNumber } = await params;
  const settings = await getSiteSettings();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const whatsappInternational = settings.whatsappNumber.replace(/^0/, '92').replace(/\s/g, '');
  const whatsappMessage = encodeURIComponent(
    `Hi WearOMNIA, I placed order #${order.orderNumber}. Could you please share the tracking updates?`
  );

  return (
    <div className="bg-offwhite min-h-screen py-16">
      <OrderSuccessConfetti />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Header Box */}
        <div className="bg-teal text-offwhite p-8 sm:p-10 rounded-3xl text-center space-y-4 shadow-2xl relative overflow-hidden border border-champagne/40">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 to-transparent" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-champagne text-teal-950 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="inline-block text-xs uppercase tracking-[0.3em] font-semibold text-champagne mt-4">
              Order Confirmed
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-offwhite">
              Thank You, {order.customerName}!
            </h1>
            <p className="text-xs sm:text-sm text-offwhite/80 max-w-md mx-auto leading-relaxed">
              Your Cash On Delivery order <strong className="text-champagne font-mono">#{order.orderNumber}</strong> has been received by our team.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-champagne">
              <span className="bg-teal-900/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2">
                <Truck className="w-4 h-4 text-champagne" /> Estimated Delivery: 2 - 4 Business Days
              </span>
              <span className="bg-teal-900/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-champagne" /> Cash On Delivery: Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="bg-sand/60 p-6 sm:p-8 rounded-3xl border border-sand shadow-lg mt-8 space-y-6">
          <div className="flex items-center justify-between border-b border-sand pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-teal">Order Summary</h3>
              <p className="text-xs text-charcoal-muted">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span className="bg-teal text-champagne text-xs font-bold px-3 py-1 rounded-full uppercase">
              Status: {order.status}
            </span>
          </div>

          {/* Delivery Address */}
          <div className="bg-offwhite p-4 rounded-2xl border border-sand space-y-1 text-xs text-charcoal">
            <h4 className="font-serif text-sm font-bold text-teal flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-champagne-700" /> Delivery Address:
            </h4>
            <p className="font-semibold">{order.customerName}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity}, {order.shippingProvince} {order.postalCode || ''}</p>
            <p className="text-charcoal-muted mt-1">Phone: {order.customerPhone}</p>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-teal">Items Ordered:</h4>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-offwhite p-3.5 rounded-xl border border-sand text-xs">
                <div>
                  <h5 className="font-serif font-bold text-teal">{item.productTitle}</h5>
                  <p className="text-[11px] text-charcoal-muted">{item.variantInfo || 'Standard'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-teal">Rs. {item.subtotal.toLocaleString()}</span>
                  <p className="text-[10px] text-charcoal-muted">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1.5 pt-4 border-t border-sand text-xs text-charcoal">
            <div className="flex justify-between text-charcoal-muted">
              <span>Subtotal:</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-teal font-semibold">
                <span>Coupon Discount:</span>
                <span>- Rs. {order.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-charcoal-muted">
              <span>Shipping Fee:</span>
              <span>{order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-teal pt-2 border-t border-sand">
              <span>Total Payable (COD):</span>
              <span>Rs. {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-sand">
            <Link
              href="/track-order"
              className="flex-1 bg-teal text-champagne py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-teal-900 transition-all flex items-center justify-center gap-2 shadow"
            >
              <Package className="w-4 h-4" /> Track Your Order
            </Link>

            <a
              href={`https://wa.me/${whatsappInternational}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-700 text-white py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-green-800 transition-all flex items-center justify-center gap-2 shadow"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Support
            </a>

            <Link
              href="/shop"
              className="flex-1 bg-sand text-teal py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-champagne transition-all flex items-center justify-center gap-2 shadow border border-sand"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
