'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { Truck, ShieldCheck, Banknote, ArrowRight, Lock, Tag, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
];

const CITIES: Record<string, string[]> = {
  Punjab: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhelum', 'Gujrat', 'Sahiwal'],
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Thatta'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Mansehra', 'Nowshera'],
  Balochistan: ['Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Sibi'],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu'],
  'Azad Jammu & Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot'],
};

export default function CheckoutPage() {
  const { cart, subtotal, appliedCoupon, applyCoupon, discountAmount, clearCart, updateQuantity, removeFromCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    email: '',
    province: 'Punjab',
    city: 'Lahore',
    address: '',
    postalCode: '',
    orderNotes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    flatShippingFee: 250,
    freeShippingThreshold: 10000,
    codCharge: 0,
  });

  // Fetch site settings for live shipping/cod calculation
  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSiteSettings({
            flatShippingFee: data.settings.flatShippingFee || 250,
            freeShippingThreshold: data.settings.freeShippingThreshold || 10000,
            codCharge: data.settings.codCharge || 0,
          });
        }
      })
      .catch(console.error);
  }, []);

  const shippingFee = subtotal >= siteSettings.freeShippingThreshold || cart.length === 0 ? 0 : siteSettings.flatShippingFee;
  const codFee = siteSettings.codCharge;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

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

  // Pakistani phone number validation
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Accept 03XXXXXXXXX (11 digits) or 923XXXXXXXXX (12 digits)
    return /^03[0-9]{8}$/.test(cleaned) || /^923[0-9]{8}$/.test(cleaned);
  };

  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    // Convert to international format
    if (cleaned.startsWith('03')) {
      return '92' + cleaned.substring(1);
    }
    return cleaned;
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Mobile number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid Pakistani mobile number (03XXXXXXXXX)';
    }

    if (formData.whatsapp && !validatePhone(formData.whatsapp)) {
      errors.whatsapp = 'Please enter a valid Pakistani WhatsApp number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      errors.address = 'Complete address is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Quantity handler with stock validation
  const handleQuantityChange = (itemId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) return; // Prevent going below 1
    if (newQuantity > maxStock) return; // Prevent exceeding stock
    updateQuantity(itemId, newQuantity);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormErrors({});

    if (cart.length === 0) {
      setFormErrors({ _form: 'Your bag is empty. Please add items before checking out.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: normalizePhone(formData.phone),
          whatsapp: formData.whatsapp ? normalizePhone(formData.whatsapp) : normalizePhone(formData.phone),
          email: formData.email,
          province: formData.province,
          city: formData.city,
          address: formData.address,
          postalCode: formData.postalCode,
          orderNotes: formData.orderNotes,
          couponCode: appliedCoupon?.code,
          items: cart.map((i) => ({
            productId: i.productId,
            title: i.title,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            price: i.price,
            sku: i.sku,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormErrors({ _form: data.error || 'Failed to place order' });
        setIsSubmitting(false);
      } else {
        clearCart();
        window.location.href = `/order-success/${data.orderNumber}`;
      }
    } catch (err) {
      console.error('Order submit error:', err);
      setFormErrors({ _form: 'A network error occurred. Please try again.' });
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !isSubmitting) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mx-auto text-teal mb-4">
            <Truck className="w-8 h-8 text-champagne-700" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-teal">Your Shopping Bag is Empty</h1>
          <p className="text-xs text-charcoal-muted mt-2">
            Explore our unstitched lawn, silk chiffon, and velvet couture collections.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-6 bg-teal text-champagne px-8 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest shadow-md hover:bg-teal-900 transition-all"
          >
            Explore Catalog
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-offwhite min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-sand/80 pb-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-champagne-700 block">
                WearOMNIA Guest Portal
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-teal mt-0.5">
                Single Page Express Checkout
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-teal bg-sand/60 px-4 py-2 rounded-full border border-sand/80">
              <ShieldCheck className="w-4 h-4 text-champagne-700" />
              <span>Zero Registration Required • Encrypted COD</span>
            </div>
          </div>

          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Form Steps */}
            <div className="lg:col-span-7 space-y-8">
              {/* Error Alert */}
              {formErrors._form && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {formErrors._form}
                </div>
              )}

              {/* Step 1: Customer Contact */}
              <div className="bg-offwhite p-6 sm:p-8 rounded-3xl border border-sand/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-sand/60 pb-4">
                  <span className="w-7 h-7 rounded-full bg-teal text-champagne font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-serif text-xl font-bold text-teal">Contact Details</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fatima Khan"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                      }}
                      className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${
                        formErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                        Mobile Phone <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 03123456789"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${
                          formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                        WhatsApp <span className="text-charcoal-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 03123456789"
                        value={formData.whatsapp}
                        onChange={(e) => {
                          setFormData({ ...formData, whatsapp: e.target.value });
                          if (formErrors.whatsapp) setFormErrors({ ...formErrors, whatsapp: '' });
                        }}
                        className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${
                          formErrors.whatsapp ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
                        }`}
                      />
                      {formErrors.whatsapp && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.whatsapp}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                      Email Address <span className="text-charcoal-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. fatima@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${
                        formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Destination */}
              <div className="bg-offwhite p-6 sm:p-8 rounded-3xl border border-sand/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-sand/60 pb-4">
                  <span className="w-7 h-7 rounded-full bg-teal text-champagne font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-serif text-xl font-bold text-teal">Delivery Address (Pakistan Only)</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                        Province <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.province}
                        onChange={(e) => {
                          const prov = e.target.value;
                          const defaultCity = CITIES[prov]?.[0] || 'Lahore';
                          setFormData({ ...formData, province: prov, city: defaultCity });
                        }}
                        className="w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border border-sand/80 focus:outline-none focus:ring-1 focus:ring-teal"
                      >
                        {PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                        City <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border border-sand/80 focus:outline-none focus:ring-1 focus:ring-teal"
                      >
                        {(CITIES[formData.province] || ['Other']).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                      House / Apartment / Street Address <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="House #, Street #, Sector, Area Landmark..."
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                      }}
                      className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${
                        formErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                        Postal Code <span className="text-charcoal-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 54000"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border border-sand/80 focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-charcoal tracking-wider block mb-1.5">
                        Special Instructions <span className="text-charcoal-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Deliver after 2 PM, call before delivery..."
                        value={formData.orderNotes}
                        onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                        className="w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border border-sand/80 focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-offwhite p-6 sm:p-8 rounded-3xl border border-sand/80 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-sand/60 pb-4">
                  <span className="w-7 h-7 rounded-full bg-teal text-champagne font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-serif text-xl font-bold text-teal">Payment Assurance</h3>
                </div>

                <div className="bg-teal text-offwhite p-6 rounded-2xl border border-champagne/40 flex items-start gap-4 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-champagne text-teal-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-serif text-lg font-bold text-champagne flex items-center gap-2">
                      Cash On Delivery (COD) <Check className="w-4 h-4 text-champagne" />
                    </span>
                    <p className="text-xs text-offwhite/80 leading-relaxed font-sans">
                      Zero online advance payment required. Pay in cash directly to our delivery courier upon unboxing your WearOMNIA parcel at your door.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-sand/60 p-6 sm:p-8 rounded-3xl border border-sand/80 shadow-lg sticky top-4 sm:top-28 space-y-6">
                <h3 className="font-serif text-xl font-bold text-teal border-b border-sand/80 pb-4">
                  Order Summary ({cart.reduce((a, b) => a + b.quantity, 0)} Items)
                </h3>

                {/* Items List with Interactive Quantity Adjusters */}
                <div className="space-y-4 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-sand/40 p-2.5 rounded-2xl border border-sand/80">
                      <div className="relative w-14 h-18 rounded-xl overflow-hidden shrink-0 bg-sand border border-sand">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs font-bold text-teal truncate">{item.title}</h4>
                        <p className="text-[11px] text-charcoal-muted">
                          Size: {item.size} | Color: {item.color}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-sand rounded-lg bg-sand text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.maxStock)}
                              disabled={item.quantity <= 1}
                              className="px-1.5 py-0.5 text-teal hover:bg-sand-dark rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.maxStock)}
                              disabled={item.quantity >= item.maxStock}
                              className="px-1.5 py-0.5 text-teal hover:bg-sand-dark rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[10px] text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-teal">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                        {item.quantity >= item.maxStock && (
                          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 justify-end">
                            <AlertCircle className="w-3 h-3" />
                            Max stock
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Drawer */}
                <div className="pt-4 border-t border-sand/80">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-champagne-100 text-teal-900 p-3 rounded-xl text-xs border border-champagne">
                      <span className="flex items-center gap-2 font-semibold">
                        <Tag className="w-4 h-4 text-teal" /> {appliedCoupon.code} (-Rs. {discountAmount.toLocaleString()})
                      </span>
                      <button
                        type="button"
                        onClick={() => applyCoupon(null)}
                        className="text-teal font-bold hover:underline text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Promo Code (e.g. WELCOME10)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2.5 text-xs bg-offwhite border border-sand/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="bg-teal text-champagne px-4 py-2.5 rounded-xl text-xs uppercase font-bold hover:bg-teal-900 transition-colors disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 pt-4 border-t border-sand/80 text-xs text-charcoal">
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Subtotal:</span>
                    <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-teal font-semibold">
                      <span>Discount:</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Nationwide Delivery:</span>
                    <span className="font-semibold">
                      {shippingFee === 0
                        ? `FREE (Orders > Rs. ${siteSettings.freeShippingThreshold.toLocaleString()})`
                        : `Rs. ${shippingFee}`}
                    </span>
                  </div>
                  {codFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">COD Fee:</span>
                      <span className="font-semibold">Rs. {codFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-teal pt-3 border-t border-sand/80">
                    <span>Grand Total (COD):</span>
                    <span>Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal text-champagne py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Order...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Place Cash On Delivery Order <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <div className="text-[11px] text-center text-charcoal-muted space-y-1 pt-2">
                  <p>🔒 7-Day Exchange Guarantee across Pakistan.</p>
                  <p>Dispatched from Lahore via Express Courier.</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
