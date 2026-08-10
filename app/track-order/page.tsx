'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, CreditCard, ShoppingBag, AlertCircle, Loader2, ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';
import { TIMELINE_STEPS, getTimelineStepIndex, STATUS_LABELS } from '@/lib/order-status';
import { PageTransition } from '@/components/layout/PageTransition';

interface TrackingItem {
  title: string;
  variant: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

interface TimelineEntry {
  status: string;
  date: string;
}

interface TrackingOrder {
  orderNumber: string;
  status: string;
  customerName: string;
  orderDate: string;
  shippingCity: string;
  shippingProvince: string;
  trackingNumber: string | null;
  courier: string | null;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  codCharges: number;
  items: TrackingItem[];
  timeline: TimelineEntry[];
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackingOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter your Order Number or Courier Tracking ID.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not find your order. Please check and try again.');
      } else {
        setOrder(data.order);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? getTimelineStepIndex(order.status) : -1;

  return (
    <PageTransition>
      <div className="bg-offwhite min-h-screen py-12 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-teal text-champagne rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Package className="w-7 h-7" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
              WearOMNIA Order Tracking
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-teal mt-1">
              Track Your Order
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-2 max-w-md mx-auto">
              Enter your order number and phone number to view real-time order status.
              No account or login required.
            </p>
          </div>

          {/* Search Form */}
          <AnimatePresence mode="wait">
            {!order ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <form
                  onSubmit={handleTrack}
                  className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 max-w-lg mx-auto"
                >
                  <div>
                    <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                      Order Number or Tracking ID <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-muted" />
                      <input
                        type="text"
                        placeholder="e.g. OMNIA-10025 or POSTEX-12345"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-4 py-3 bg-sand/50 rounded-xl text-sm text-charcoal border border-sand/80 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 uppercase font-mono font-semibold transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                      Phone Number <span className="text-charcoal-muted font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-muted" />
                      <input
                        type="tel"
                        placeholder="e.g. 03001234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-sand/50 rounded-xl text-sm text-charcoal border border-sand/80 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 font-mono transition-all duration-300"
                      />
                    </div>
                    <p className="text-[10px] text-charcoal-muted mt-1.5">
                      Use the phone number you provided during checkout.
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs font-medium"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ translateY: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading}
                    className="w-full btn-premium btn-primary !py-3.5 disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                    ) : (
                      <><Search className="w-4 h-4" /> Track Order</>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  onClick={() => { setOrder(null); setError(''); }}
                  className="flex items-center gap-1.5 text-xs text-teal font-semibold hover:text-champagne-700 transition-colors duration-300"
                >
                  <ArrowLeft className="w-4 h-4" /> Track Another Order
                </button>

                {/* Status Header Card */}
                <div className="bg-teal text-offwhite p-6 sm:p-8 rounded-3xl text-center space-y-3 shadow-xl border border-champagne/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 to-transparent" />
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-champagne">
                      WearOMNIA
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-offwhite mt-1">
                      Order #{order.orderNumber}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="bg-champagne/20 text-champagne px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-champagne/30">
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                      </span>
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
                        <span className="text-offwhite/70">Tracking:</span>
                        <span className="font-mono font-bold text-champagne">{order.trackingNumber}</span>
                        {order.courier && (
                          <span className="bg-teal-900/80 text-champagne px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-champagne/20">
                            {order.courier}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Timeline */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl">
                  <h3 className="font-serif text-lg font-bold text-teal mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-champagne-700" /> Order Timeline
                  </h3>

                  <div className="relative pl-10">
                    <div className="timeline-line" />

                    {TIMELINE_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const isPending = index > currentStepIndex;

                      // Find actual timeline entry for this step
                      const timelineEntry = order.timeline.find(
                        (t) => t.status === step.status
                      );

                      return (
                        <motion.div
                          key={step.status}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className={`relative flex items-start gap-4 pb-8 last:pb-0 ${isPending ? 'opacity-40' : ''}`}
                        >
                          <div className={
                            isCurrent ? 'timeline-dot-current' :
                            isCompleted ? 'timeline-dot-completed' :
                            'timeline-dot-pending'
                          }>
                            <span className="text-xs">{isCompleted ? '✓' : step.icon}</span>
                          </div>

                          <div className="pt-1">
                            <h4 className={`text-sm font-bold ${isCurrent ? 'text-teal' : isCompleted ? 'text-teal' : 'text-charcoal-muted'}`}>
                              {step.label}
                            </h4>
                            {timelineEntry && (
                              <p className="text-[11px] text-charcoal-muted mt-0.5 font-mono">
                                {new Date(timelineEntry.date).toLocaleDateString('en-PK', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            )}
                            {isPending && !timelineEntry && (
                              <p className="text-[11px] text-charcoal-muted/60 mt-0.5 italic">
                                Pending
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Show Cancelled/Returned if applicable */}
                    {(order.status === 'CANCELLED' || order.status === 'RETURNED') && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative flex items-start gap-4 pb-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center border-2 border-red-300 z-10 relative">
                          <span className="text-xs">✕</span>
                        </div>
                        <div className="pt-1">
                          <h4 className="text-sm font-bold text-red-700">
                            {order.status === 'CANCELLED' ? 'Cancelled' : 'Returned'}
                          </h4>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5">
                  <h3 className="font-serif text-lg font-bold text-teal flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-champagne-700" /> Order Details
                  </h3>

                  {/* Products */}
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-sand/30 p-3 rounded-xl border border-sand/50 text-xs">
                        <div>
                          <h4 className="font-serif font-bold text-teal">{item.title}</h4>
                          {item.variant && <p className="text-[11px] text-charcoal-muted">{item.variant}</p>}
                          <p className="text-[11px] text-charcoal-muted">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-teal font-mono">
                          Rs. {item.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-1.5 pt-4 border-t border-sand/80 text-xs text-charcoal">
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Subtotal:</span>
                      <span>Rs. {order.subtotal.toLocaleString()}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-teal font-semibold">
                        <span>Discount:</span>
                        <span>- Rs. {order.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-charcoal-muted">
                      <span>Shipping:</span>
                      <span>{order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-teal pt-2 border-t border-sand/80">
                      <span>Total (COD):</span>
                      <span>Rs. {order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="pt-4 border-t border-sand/80 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-charcoal-muted block mb-1">Delivery City</span>
                      <span className="font-semibold text-teal">{order.shippingCity}, {order.shippingProvince}</span>
                    </div>
                    <div>
                      <span className="text-charcoal-muted block mb-1">Payment Method</span>
                      <span className="font-semibold text-teal">Cash on Delivery</span>
                    </div>
                    <div>
                      <span className="text-charcoal-muted block mb-1">Order Date</span>
                      <span className="font-semibold text-teal font-mono">
                        {new Date(order.orderDate).toLocaleDateString('en-PK', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </span>
                    </div>
                    {order.courier && (
                      <div>
                        <span className="text-charcoal-muted block mb-1">Courier</span>
                        <span className="font-semibold text-teal">{order.courier}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Help Section */}
                <div className="text-center text-xs text-charcoal-muted space-y-2 pt-4">
                  <p>Need help? Contact our WhatsApp concierge for live assistance.</p>
                  <a
                    href={`https://wa.me/923180633323?text=${encodeURIComponent(`Hi! I need help with my order #${order.orderNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-green-800 transition-all duration-300"
                  >
                    WhatsApp Support
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
