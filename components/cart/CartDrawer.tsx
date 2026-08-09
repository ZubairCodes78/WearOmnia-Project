'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Lock, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    subtotal,
    discountAmount,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const freeShippingThreshold = 10000;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal >= freeShippingThreshold || cart.length === 0 ? 0 : 250;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Invalid promo code');
      } else {
        applyCoupon(data);
        setCouponInput('');
      }
    } catch (err) {
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay with Glass Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-50 bg-teal-950/60 backdrop-blur-sm"
          />

          {/* Slide-over Cart Drawer Panel with Glass Effect */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-offwhite/[0.94] backdrop-blur-xl text-teal flex flex-col shadow-2xl border-l border-champagne/15"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-sand/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal" />
                <h2 className="font-serif text-lg font-bold uppercase tracking-tight text-teal">
                  Shopping Bag ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-teal hover:text-champagne-700 transition-colors duration-300 rounded-lg hover:bg-sand/60"
                aria-label="Close Bag"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Free Shipping Meter */}
            <div className="bg-sand/50 px-6 py-3 border-b border-sand/80 text-xs">
              {remainingForFreeShipping > 0 ? (
                <p className="text-charcoal font-medium">
                  Add <span className="font-bold text-teal">Rs. {remainingForFreeShipping.toLocaleString()}</span> more for <span className="font-bold text-teal">Free Shipping</span> across Pakistan
                </p>
              ) : (
                <p className="text-teal font-bold flex items-center gap-1">
                  🎉 Congratulations! You have unlocked FREE Nationwide Delivery!
                </p>
              )}
              <div className="w-full bg-sand h-1.5 rounded-full overflow-hidden mt-2">
                <motion.div
                  className="bg-teal h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Drawer Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center text-teal">
                    <ShoppingBag className="w-8 h-8 text-champagne-700" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-teal">Your Bag is Empty</h3>
                  <p className="text-xs text-charcoal-muted max-w-xs">
                    Discover luxury velvet kaftans and silk chiffon suits from our collection.
                  </p>
                  <motion.button
                    whileHover={{ translateY: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsCartOpen(false)}
                    className="btn-premium btn-primary"
                  >
                    Explore Catalog
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: 60 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-4 p-3 bg-sand/25 rounded-2xl border border-sand/50 transition-all duration-300 hover:border-champagne/40"
                    >
                      {/* Item Thumbnail */}
                      <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-sand border border-sand">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Item Information */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-serif text-xs font-bold text-teal line-clamp-1">
                              {item.title}
                            </h4>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeFromCart(item.id)}
                              className="text-charcoal-muted hover:text-red-600 p-0.5 transition-colors duration-200"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                          <p className="text-[11px] text-charcoal-muted mt-0.5">
                            Size: <span className="font-semibold text-charcoal">{item.size}</span> | Color: <span className="font-semibold text-charcoal">{item.color}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-sand/80 rounded-lg bg-offwhite">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-sand rounded-l-lg transition-colors duration-200"
                            >
                              <Minus className="w-3 h-3 text-teal" />
                            </motion.button>
                            <span className="px-2.5 text-xs font-bold text-teal">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-sand rounded-r-lg transition-colors duration-200"
                            >
                              <Plus className="w-3 h-3 text-teal" />
                            </motion.button>
                          </div>

                          {/* Price */}
                          <span className="font-sans font-bold text-xs text-teal">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Drawer Footer (Only if cart has items) */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-sand/80 bg-offwhite/80 backdrop-blur-sm space-y-4 shadow-[0_-4px_20px_rgba(16,61,66,0.04)]">
                {/* Promo Coupon Application */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-champagne-100 text-teal-900 p-2.5 rounded-xl text-xs border border-champagne">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Tag className="w-3.5 h-3.5 text-teal" /> {appliedCoupon.code} (-Rs. {discountAmount.toLocaleString()})
                    </span>
                    <button
                      onClick={() => applyCoupon(null)}
                      className="text-teal font-bold hover:underline text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-xs bg-sand/50 rounded-xl text-charcoal border border-sand/80 focus:outline-none focus:ring-1 focus:ring-teal uppercase"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={couponLoading}
                      className="btn-premium btn-primary !py-2 !px-4 !text-[10px] disabled:opacity-50"
                    >
                      Apply
                    </motion.button>
                  </form>
                )}
                {couponError && <p className="text-[10px] text-red-600 font-semibold">{couponError}</p>}

                {/* Subtotal & Total */}
                <div className="space-y-1.5 text-xs text-charcoal pt-2">
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Subtotal:</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-teal font-semibold">
                      <span>Coupon Discount:</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Nationwide Express COD Delivery:</span>
                    <span>{shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-teal pt-2 border-t border-sand/80">
                    <span>Grand Total:</span>
                    <span>Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Express Checkout Button */}
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                >
                  <motion.div
                    whileHover={{ translateY: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-teal text-champagne py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group"
                  >
                    <Lock className="w-4 h-4" /> Single Page Guest Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.div>
                </Link>

                <p className="text-[10px] text-center text-charcoal-muted flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal" /> 100% Cash On Delivery • 7-Day Nationwide Exchange
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
