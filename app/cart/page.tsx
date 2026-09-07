'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, ArrowLeft, CheckCircle2, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    appliedCoupon,
    applyCoupon,
    discountAmount,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const freeShippingThreshold = 10000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const estimatedShipping = subtotal >= freeShippingThreshold || cart.length === 0 ? 0 : 250;
  const grandTotal = Math.max(0, subtotal - discountAmount + estimatedShipping);

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
    <div className="editorial-page !py-10 font-sans text-teal">
      <div className="editorial-container max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sand/80 pb-6">
          <div className="space-y-1">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">Review &amp; Checkout</span>
            <h1 className="font-serif text-3xl sm:text-5xl font-black text-teal tracking-tight">Your Shopping Bag</h1>
            <p className="text-xs text-charcoal-muted font-sans pt-0.5">Good choice. Your wardrobe agrees.</p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-teal hover:text-champagne-700 transition-colors bg-sand/50 px-4 py-2 rounded-xl border border-sand/80"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="editorial-surface p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto text-teal">
              <ShoppingBag className="w-8 h-8 text-champagne-700" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-teal uppercase tracking-tight">Your Cart is Taking a Break.</h2>
            <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
              Give it something to do. Your wardrobe called — it wants better attendance.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-teal text-champagne px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-900 transition-all shadow-md"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Item List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Alert Bar */}
              <div className="editorial-surface p-4 text-xs">
                {remainingForFreeShipping > 0 ? (
                  <p className="text-charcoal">
                    Add <span className="font-bold text-teal">Rs. {remainingForFreeShipping.toLocaleString()}</span> PKR more to qualify for <span className="font-bold text-teal">Free Express Nationwide Shipping</span>.
                  </p>
                ) : (
                  <p className="text-teal font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>You have unlocked Free Express Nationwide Shipping across Pakistan!</span>
                  </p>
                )}
              </div>

              <div className="editorial-surface overflow-hidden">
                <div className="divide-y divide-sand">
                  {cart.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-sand shrink-0 border border-sand">
                          <Image src={item.image} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-serif font-bold text-teal text-base">{item.title}</h3>
                          <p className="text-xs text-charcoal-muted">
                            Size: <span className="font-semibold text-teal">{item.size}</span> • Color: <span className="font-semibold text-teal">{item.color}</span>
                          </p>
                          <p className="text-xs font-mono text-champagne-700">SKU: {item.sku}</p>
                          <p className="font-serif font-bold text-teal text-sm sm:hidden mt-2">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Modifier & Line Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-sand">
                        <div className="flex items-center border border-sand rounded-xl bg-sand">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 text-teal hover:bg-sand-dark rounded-l-xl disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="p-2 text-teal hover:bg-sand-dark rounded-r-xl disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-serif font-bold text-teal text-lg hidden sm:block">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-charcoal-muted hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="editorial-surface p-6 space-y-6">
                <h3 className="font-serif text-xl font-bold text-teal border-b border-sand pb-3">Order Summary</h3>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. OMNIA10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-offwhite border border-sand rounded-xl focus:outline-none focus:ring-1 focus:ring-teal uppercase font-mono"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-teal text-champagne px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-teal-900 transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-600 text-[11px]">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-xs bg-teal/10 text-teal p-2 rounded-xl border border-teal/20 font-medium">
                      <span>Code '{appliedCoupon.code}' Applied</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </form>

                {/* Breakdown */}
                <div className="space-y-3 text-xs text-charcoal">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-serif font-bold text-teal text-sm">Rs. {subtotal.toLocaleString()}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Estimated Shipping Fee</span>
                    <span>{estimatedShipping === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `Rs. ${estimatedShipping}`}</span>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-sand text-base font-bold">
                    <span className="font-serif text-teal">Grand Total</span>
                    <span className="font-serif text-teal text-xl">Rs. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Humorous Relatable Tip */}
                <div className="bg-sand/60 border border-champagne/60 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-charcoal">
                  <Heart className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-teal text-[11px] uppercase tracking-wider">
                      Sister-Theft Advisory
                    </p>
                    <p className="text-[10.5px] text-charcoal-muted leading-tight">
                      Checkout before your sister spots this tab and claims she was going to wear it first!
                    </p>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full btn-premium btn-primary !py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 border border-champagne/30 cursor-pointer"
                >
                  Proceed To Instant Checkout <ArrowRight className="w-4 h-4 text-champagne" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-[11px] text-charcoal-muted pt-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-teal" />
                  <span>Cash On Delivery Available Nationwide Across Pakistan</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
