import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, Truck, ArrowRight, MessageSquare, ShieldCheck, MapPin, Package, Clock, AlertTriangle } from 'lucide-react';
import { OrderSuccessConfetti } from './OrderSuccessConfetti';
import { PreOrderResubmitProof } from './PreOrderResubmitProof';
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
    `Hi WearOMNIA, I placed ${order.isPreOrder ? 'Pre-Order' : 'order'} ${order.orderNumber}. Could you please share updates?`
  );

  const isPreOrder = Boolean(order.isPreOrder);
  const paymentStatus = order.preOrderPaymentStatus || 'PAYMENT_REVIEW_PENDING';
  const isRejected = isPreOrder && paymentStatus === 'PAYMENT_REJECTED';
  const isApproved = isPreOrder && paymentStatus === 'PAYMENT_APPROVED';
  const isReviewPending = isPreOrder && !isRejected && !isApproved;

  return (
    <div className="editorial-page">
      <OrderSuccessConfetti />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Header Box */}
        <div className={`p-8 sm:p-12 rounded-3xl text-center space-y-4 shadow-xl relative overflow-hidden border ${
          isRejected 
            ? 'bg-amber-950 text-offwhite border-amber-500/40' 
            : 'bg-teal text-offwhite border-champagne/40'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
          <div className="relative z-10 space-y-2">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md border mb-3 ${
              isRejected 
                ? 'bg-amber-400 text-amber-950 border-amber-200' 
                : 'bg-champagne text-teal-950 border-white/40'
            }`}>
              {isRejected ? (
                <AlertTriangle className="w-10 h-10 text-amber-900" />
              ) : isReviewPending ? (
                <Clock className="w-10 h-10 text-teal" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-teal" />
              )}
            </div>

            <span className="font-calligraphy text-xs sm:text-sm text-champagne block tracking-[0.2em]">
              {isPreOrder ? 'Exclusive Pre-Order' : "It's Official."}
            </span>

            <h1 className="font-serif text-3xl sm:text-5xl font-black text-offwhite tracking-tight">
              {isRejected
                ? 'Action Required: Verify Payment Proof'
                : isReviewPending
                ? 'Pre-Order Received! Verifying Payment'
                : 'Your Wardrobe Just Got A Little Happier.'}
            </h1>

            <p className="text-xs sm:text-sm text-offwhite/90 max-w-md mx-auto leading-relaxed pt-1 font-sans">
              {isRejected ? (
                <>Your Pre-Order <strong className="text-champagne font-mono font-bold">{order.orderNumber}</strong> has been logged, but our finance team could not verify the uploaded payment proof. Please see below to resubmit.</>
              ) : isReviewPending ? (
                <>Your Pre-Order <strong className="text-champagne font-mono font-bold">{order.orderNumber}</strong> has been submitted with your 50% advance payment proof. Our team is verifying your payment and will confirm shortly via WhatsApp.</>
              ) : isPreOrder ? (
                <>Your 50% advance payment for Pre-Order <strong className="text-champagne font-mono font-bold">{order.orderNumber}</strong> is confirmed! Your artisan piece is reserved and entering production.</>
              ) : (
                <>Now comes the hardest part: waiting for it to arrive. Your Cash On Delivery order <strong className="text-champagne font-mono font-bold">{order.orderNumber}</strong> is confirmed and being prepared with care.</>
              )}
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3 text-xs font-semibold text-champagne">
              {isPreOrder ? (
                <>
                  <span className="bg-teal-950/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-champagne" /> Advance (50%): Rs. {(order.preOrderAdvanceAmount || 0).toLocaleString()}
                  </span>
                  <span className="bg-teal-950/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2 shadow-sm">
                    <Truck className="w-4 h-4 text-champagne" /> Balance Due on Delivery (COD): Rs. {(order.preOrderRemainingAmount || 0).toLocaleString()}
                  </span>
                  {order.preOrderPaymentMethodName && (
                    <span className="bg-teal-950/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2 shadow-sm">
                      Method: {order.preOrderPaymentMethodName}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="bg-teal-950/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2 shadow-sm">
                    <Truck className="w-4 h-4 text-champagne" /> Estimated Delivery: 2 – 4 Business Days
                  </span>
                  <span className="bg-teal-950/80 px-4 py-2 rounded-full border border-champagne/30 flex items-center gap-2 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-champagne" /> Cash On Delivery: Rs. {order.totalAmount.toLocaleString()}
                  </span>
                </>
              )}
            </div>

            <p className="text-[11px] text-champagne/90 pt-2 font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-champagne shrink-0" />
              <span>Modest enough for uni. Pretty enough for the &ldquo;Where did you get that?&rdquo;</span>
            </p>
          </div>
        </div>

        {/* If Pre-order payment was rejected, render Resubmit form */}
        {isRejected && (
          <PreOrderResubmitProof
            orderNumber={order.orderNumber}
            customerPhone={order.customerPhone}
            rejectionReason={order.preOrderPaymentRejectionReason}
          />
        )}

        {/* Order Details & Summary Card */}
        <div className="editorial-dossier mt-8 space-y-6">
          <div className="flex items-center justify-between border-b border-sand pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-teal">
                {isPreOrder ? 'Pre-Order Dossier' : 'Order Summary'}
              </h3>
              <p className="text-xs text-charcoal-muted">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {isPreOrder && (
                <span className="bg-champagne text-teal-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  PRE-ORDER
                </span>
              )}
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                isApproved 
                  ? 'bg-emerald-600 text-white' 
                  : isRejected 
                  ? 'bg-red-600 text-white' 
                  : 'bg-teal text-champagne'
              }`}>
                {isPreOrder ? `Payment: ${paymentStatus.replace('PAYMENT_', '')}` : `Status: ${order.status}`}
              </span>
            </div>
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
            <h4 className="font-serif text-sm font-bold text-teal">
              {isPreOrder ? 'Reserved Pre-Order Items:' : 'Items Ordered:'}
            </h4>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-offwhite p-3.5 rounded-xl border border-sand text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-serif font-bold text-teal">{item.productTitle}</h5>
                    {isPreOrder && (
                      <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-300">
                        PRE-ORDER
                      </span>
                    )}
                  </div>
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
            <div className="flex justify-between font-bold text-charcoal pt-1">
              <span>Total Order Value:</span>
              <span>Rs. {order.totalAmount.toLocaleString()}</span>
            </div>

            {isPreOrder && (
              <div className="pt-2 mt-2 border-t border-dashed border-sand space-y-1.5 bg-champagne/15 p-3 rounded-xl">
                <div className="flex justify-between text-teal font-bold">
                  <span>50% Advance Payable / Paid:</span>
                  <span>Rs. {(order.preOrderAdvanceAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-charcoal-muted text-[11px]">
                  <span>Payment Method:</span>
                  <span className="font-medium text-teal">{order.preOrderPaymentMethodName || 'Manual Transfer'}</span>
                </div>
                <div className="flex justify-between text-teal-900 font-extrabold text-sm pt-1 border-t border-champagne/30">
                  <span>Remaining Balance on Delivery (COD):</span>
                  <span>Rs. {(order.preOrderRemainingAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            {!isPreOrder && (
              <div className="flex justify-between text-lg font-bold text-teal pt-2 border-t border-sand">
                <span>Total Payable (COD):</span>
                <span>Rs. {order.totalAmount.toLocaleString()}</span>
              </div>
            )}
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
