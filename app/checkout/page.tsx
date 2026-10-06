'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import {
  Truck,
  ShieldCheck,
  Banknote,
  ArrowRight,
  Lock,
  Tag,
  ChevronRight,
  Check,
  AlertCircle,
  CreditCard,
  QrCode,
  UploadCloud,
  FileCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { normalizePhone, validatePhone } from '@/lib/phone';
import { calculateDiscountPercent } from '@/lib/pricing';

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
  const { cart, subtotal, appliedCoupon, applyCoupon, discountAmount, clearCart, updateQuantity, removeFromCart, setIsCartOpen } = useCart();

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
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    flatShippingFee: typeof settings?.flatShippingFee === 'number' ? settings.flatShippingFee : 250,
    freeShippingThreshold: typeof settings?.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : 10000,
    codCharge: typeof settings?.codCharge === 'number' ? settings.codCharge : 0,
  });

  // Keep checkout in sync with live settings
  useEffect(() => {
    if (settings) {
      setSiteSettings({
        flatShippingFee: typeof settings.flatShippingFee === 'number' ? settings.flatShippingFee : 250,
        freeShippingThreshold: typeof settings.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : 10000,
        codCharge: typeof settings.codCharge === 'number' ? settings.codCharge : 0,
      });
    }
  }, [settings]);

  // Pre-Order Detection & State
  const isPreOrderCart = cart.length > 0 && cart.every((i) => i.isPreOrder);
  const isMixedCart = cart.some((i) => i.isPreOrder) && cart.some((i) => !i.isPreOrder);

  const [preOrderConfig, setPreOrderConfig] = useState<{
    enabled: boolean;
    advancePercent: number;
    instructions: string;
    paymentMethods: Array<{
      id: string;
      displayName: string;
      methodType: string;
      accountTitle: string;
      accountNumber: string;
      walletNumber?: string | null;
      bankName?: string | null;
      iban?: string | null;
      instructions?: string | null;
      hasQrCode: boolean;
    }>;
  } | null>(null);

  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [screenshotKey, setScreenshotKey] = useState<string>('');
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotError, setScreenshotError] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Fetch pre-order configuration if pre-order items present
  useEffect(() => {
    if (isPreOrderCart) {
      fetch('/api/preorder-settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPreOrderConfig(data);
            if (data.paymentMethods && data.paymentMethods.length > 0) {
              setSelectedMethodId(data.paymentMethods[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isPreOrderCart]);

  const shippingFee = subtotal >= siteSettings.freeShippingThreshold || cart.length === 0 ? 0 : siteSettings.flatShippingFee;
  const codFee = isPreOrderCart ? 0 : siteSettings.codCharge;
  const effectiveAdvancePercent = preOrderConfig?.advancePercent || settings?.preorder_advance_percent || 50;

  const totalAmount = isPreOrderCart
    ? Math.max(0, subtotal - discountAmount + shippingFee)
    : Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  const preOrderAdvanceAmount = isPreOrderCart
    ? Math.round((totalAmount * effectiveAdvancePercent) / 100)
    : 0;

  const preOrderRemainingAmount = isPreOrderCart
    ? Math.max(0, totalAmount - preOrderAdvanceAmount)
    : 0;

  const totalOriginalPrice = cart.reduce((acc, item) => acc + ((item.basePrice || item.price) * item.quantity), 0);
  const youSaveDiscount = Math.max(0, totalOriginalPrice - subtotal);

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

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError('Payment screenshot must be smaller than 5MB');
      return;
    }

    setScreenshotError('');
    setScreenshotUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/preorder/upload-screenshot', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.screenshotKey) {
        setScreenshotError(data.error || 'Failed to upload screenshot. Please try again.');
        setScreenshotKey('');
      } else {
        setScreenshotKey(data.screenshotKey);
      }
    } catch {
      setScreenshotError('Network error uploading screenshot. Please try again.');
      setScreenshotKey('');
    } finally {
      setScreenshotUploading(false);
    }
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
      errors.phone = 'Please enter a valid Pakistani mobile number.';
    }

    if (formData.whatsapp && !validatePhone(formData.whatsapp)) {
      errors.whatsapp = 'Please enter a valid Pakistani mobile number.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      errors.address = 'Complete address is required';
    }

    if (isPreOrderCart) {
      if (!selectedMethodId) {
        errors.paymentMethod = 'Please select a payment method for advance transfer';
      }
      if (!screenshotKey) {
        errors.screenshot = 'Please upload your advance payment proof screenshot';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Quantity handler with stock validation
  const handleQuantityChange = (itemId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) return;
    if (!isPreOrderCart && newQuantity > maxStock) return;
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

    if (isMixedCart) {
      setFormErrors({
        _form: 'Mixed cart detected. Pre-order and in-stock items cannot be ordered together. Please visit your cart to separate them.',
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isPreOrderCart ? '/api/preorder/checkout' : '/api/orders';
      const payload: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        whatsapp: formData.whatsapp ? formData.whatsapp : formData.phone,
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
      };

      if (isPreOrderCart) {
        payload.screenshotKey = screenshotKey;
        payload.selectedPaymentMethodId = selectedMethodId;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  if (isMixedCart) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal">
            Pre-order and regular products need to be ordered separately.
          </h1>
          <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed font-sans">
            Pre-order pieces require an advance bank/wallet transfer with payment screenshot verification, while regular in-stock pieces are dispatched immediately via Cash On Delivery.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                // Keep only pre-order items
                cart.filter((item) => !item.isPreOrder).forEach((item) => removeFromCart(item.id));
              }}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all shadow-md cursor-pointer"
            >
              Keep Only Pre-Order Items
            </button>
            <button
              onClick={() => {
                // Keep only regular items
                cart.filter((item) => item.isPreOrder).forEach((item) => removeFromCart(item.id));
              }}
              className="w-full sm:w-auto bg-teal hover:bg-teal-900 text-champagne px-6 py-3 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all shadow-md cursor-pointer border border-champagne/30"
            >
              Keep Only Regular Products
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-xs text-teal underline font-bold uppercase tracking-wider hover:text-champagne-700 cursor-pointer"
            >
              View &amp; Edit Shopping Bag
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (cart.length === 0 && !isSubmitting) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mx-auto text-teal mb-4">
            <Truck className="w-8 h-8 text-champagne-700" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-teal uppercase tracking-tight">Your Cart is Taking a Break.</h1>
          <p className="text-xs text-charcoal-muted mt-2 max-w-sm mx-auto leading-relaxed font-sans">
            Give it something to do! Explore our ready-to-wear silhouettes and find your next go-to outfit.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-6 bg-teal text-champagne px-8 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest shadow-md hover:bg-teal-900 transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="editorial-page !py-6 sm:!py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-sand/80 pb-6 mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
                {isPreOrderCart ? 'Atelier Pre-Order' : 'Fast & Simple'}
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-teal tracking-tight">
                {isPreOrderCart ? 'Pre-Order Advance Checkout' : 'Cash On Delivery Checkout'}
              </h1>
              <p className="text-xs text-charcoal-muted pt-0.5 font-sans">
                {isPreOrderCart
                  ? `Pay ${effectiveAdvancePercent}% advance via bank/wallet transfer. Remaining balance upon delivery.`
                  : 'Almost there. Your next favourite outfit is waiting.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-teal bg-sand/60 px-4 py-2.5 rounded-2xl border border-sand/80 font-medium self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
              <span>
                {isPreOrderCart
                  ? `${effectiveAdvancePercent}% Advance Verification • Remaining COD`
                  : 'No Account Required • Pay When You Receive'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Form Steps */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              {/* Error Alert */}
              {formErrors._form && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {formErrors._form}
                </div>
              )}

              {/* Step 1: Customer Contact */}
              <div className="editorial-surface p-4 sm:p-6 lg:p-8 space-y-6">
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
                      className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${formErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
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
                        Phone Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="03XX XXXXXXX"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
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
                        className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${formErrors.whatsapp ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
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
                      className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
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
              <div className="editorial-surface p-4 sm:p-6 lg:p-8 space-y-6">
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
                      className={`w-full px-4 py-3 bg-sand/50 rounded-xl text-xs text-charcoal border focus:outline-none focus:ring-1 ${formErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-sand/80 focus:ring-teal'
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
              <div className="editorial-surface p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-sand/60 pb-4">
                  <span className="w-7 h-7 rounded-full bg-teal text-champagne font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-serif text-xl font-bold text-teal">
                    {isPreOrderCart ? 'Advance Payment & Verification' : 'Payment Assurance'}
                  </h3>
                </div>

                {!isPreOrderCart ? (
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
                ) : (
                  <div className="space-y-6">
                    {/* Section 5: PRE-ORDER PAYMENT NOTICE */}
                    <div className="bg-amber-500/15 border-2 border-amber-500/40 p-4 rounded-2xl space-y-1.5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          PRE-ORDER PAYMENT
                        </span>
                      </div>
                      <p className="text-xs text-amber-950 font-medium leading-relaxed">
                        This is a pre-order. A {effectiveAdvancePercent}% advance payment is required to confirm your order. Cash on Delivery is not available for pre-orders.
                      </p>
                    </div>

                    {/* Advance Breakdown Banner */}
                    <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-amber-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-amber-700" />
                          Required Advance Payment: {effectiveAdvancePercent}%
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-950">
                          Rs. {preOrderAdvanceAmount.toLocaleString()} PKR
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <span className="text-charcoal-muted block">Advance Payable Now:</span>
                          <span className="font-serif font-bold text-amber-900 text-sm">
                            Rs. {preOrderAdvanceAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-charcoal-muted block">Balance on Delivery:</span>
                          <span className="font-serif font-bold text-teal text-sm">
                            Rs. {preOrderRemainingAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {preOrderConfig?.instructions && (
                        <p className="text-[11px] text-amber-900/80 pt-2 border-t border-amber-500/15 leading-relaxed font-sans">
                          {preOrderConfig.instructions}
                        </p>
                      )}
                    </div>

                    {/* Payment Methods Selector */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                        1. Select Official Payment Account *
                      </label>
                      {formErrors.paymentMethod && (
                        <p className="text-[11px] text-red-600 font-semibold">{formErrors.paymentMethod}</p>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        {preOrderConfig?.paymentMethods?.map((m) => {
                          const isSelected = selectedMethodId === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() => setSelectedMethodId(m.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-teal bg-sand/60 shadow-md'
                                  : 'border-sand/70 bg-sand/20 hover:border-sand hover:bg-sand/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-serif font-bold text-teal text-sm">
                                      {m.displayName}
                                    </span>
                                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-teal text-champagne">
                                      {m.methodType}
                                    </span>
                                  </div>
                                  <p className="text-xs text-charcoal">
                                    Title: <strong className="font-semibold text-teal">{m.accountTitle}</strong>
                                  </p>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-xs font-mono font-bold text-champagne-800 bg-sand/80 px-2 py-0.5 rounded-lg border border-sand">
                                      {m.accountNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(m.accountNumber);
                                        setCopiedAccount(true);
                                        setTimeout(() => setCopiedAccount(false), 2000);
                                      }}
                                      className="text-[10px] text-teal hover:underline font-bold uppercase"
                                    >
                                      {copiedAccount ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                  {m.bankName && (
                                    <p className="text-[11px] text-charcoal-muted">Bank: {m.bankName}</p>
                                  )}
                                  {m.iban && (
                                    <p className="text-[10px] font-mono text-charcoal-muted">IBAN: {m.iban}</p>
                                  )}
                                </div>

                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 border-teal">
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-teal" />}
                                </div>
                              </div>

                              {/* QR Code image if available and selected */}
                              {isSelected && m.hasQrCode && (
                                <div className="mt-4 pt-3 border-t border-sand flex items-center gap-4">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`/api/preorder/payment-methods/${m.id}/qr`}
                                    alt="Payment QR Code"
                                    className="w-28 h-28 object-contain rounded-xl border border-sand bg-white p-2 shadow-sm"
                                  />
                                  <div className="space-y-1 text-xs">
                                    <span className="font-bold text-teal flex items-center gap-1">
                                      <QrCode className="w-4 h-4 text-champagne-700" /> Scan QR to Pay
                                    </span>
                                    <p className="text-[11px] text-charcoal-muted leading-relaxed font-sans">
                                      Scan this QR in your bank/wallet app and transfer Rs. {preOrderAdvanceAmount.toLocaleString()}.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Screenshot Upload Section */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                        2. Upload Payment Proof Screenshot *
                      </label>
                      <p className="text-[11px] text-charcoal-muted">
                        Upload the transaction receipt or screenshot after sending Rs. {preOrderAdvanceAmount.toLocaleString()}.
                      </p>

                      <div className="border-2 border-dashed border-sand/80 rounded-2xl p-5 bg-sand/30 hover:bg-sand/50 transition-colors text-center space-y-3">
                        {screenshotUploading ? (
                          <div className="flex flex-col items-center gap-2 py-4 text-teal">
                            <Loader2 className="w-6 h-6 animate-spin text-champagne-700" />
                            <span className="text-xs font-bold">Securing screenshot...</span>
                          </div>
                        ) : screenshotKey ? (
                          <div className="flex flex-col items-center gap-2 py-2 text-emerald-800">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                            </div>
                            <span className="text-xs font-bold">Screenshot Attached Successfully!</span>
                            <span className="text-[10px] text-charcoal-muted font-mono">{screenshotKey}</span>
                            <label className="text-[11px] text-teal underline font-bold cursor-pointer mt-1">
                              Replace Screenshot
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleScreenshotUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 py-3 cursor-pointer">
                            <UploadCloud className="w-8 h-8 text-champagne-700" />
                            <span className="text-xs font-bold text-teal">
                              Click or Drag to Upload Payment Screenshot
                            </span>
                            <span className="text-[10px] text-charcoal-muted">
                              JPEG, PNG, or WebP up to 5MB
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {screenshotError && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {screenshotError}
                        </p>
                      )}

                      {formErrors.screenshot && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.screenshot}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="lg:col-span-5 space-y-6">
              <div className="editorial-surface p-4 sm:p-6 lg:p-8 static lg:sticky lg:top-28 space-y-6">
                <h3 className="font-serif text-xl font-bold text-teal border-b border-sand/80 pb-4">
                  Order Summary ({cart.reduce((a, b) => a + b.quantity, 0)} Items)
                </h3>

                {/* Items List with Interactive Quantity Adjusters */}
                <div className="space-y-4 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const itemDiscount = calculateDiscountPercent(item.basePrice, item.price);
                    return (
                    <div key={item.id} className="flex items-center gap-3 bg-sand/40 p-2.5 rounded-2xl border border-sand/80">
                      {/* Product Thumbnail - 4:5 aspect ratio preserved, compact 56px mobile / 64px desktop */}
                      <div className="relative w-14 sm:w-16 aspect-[4/5] rounded-xl overflow-hidden shrink-0 bg-sand/80 border border-sand">
                        <Image
                          src={item.image || '/images/kaftan-1.jpg'}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 56px, 64px"
                          className="object-cover"
                        />
                        {itemDiscount > 0 && (
                          <span className="absolute top-1 left-1 z-10 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-teal-900 text-champagne border border-champagne/40">
                            {itemDiscount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-xs font-bold text-teal line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                          {item.isPreOrder && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-900 shrink-0">
                              Pre-Order
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-charcoal-muted mt-0.5">
                          Size: {item.size} | Color: {item.color}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
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
                              disabled={!isPreOrderCart && item.quantity >= item.maxStock}
                              className="px-1.5 py-0.5 text-teal hover:bg-sand-dark rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[10px] text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-teal">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                        {itemDiscount > 0 && (
                          <div className="flex flex-col items-end mt-0.5">
                            <span className="text-[10px] text-charcoal-muted line-through">
                              Rs. {(item.basePrice * item.quantity).toLocaleString()}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-champagne-200 text-teal">
                              {itemDiscount}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
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
                  {!isPreOrderCart && codFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">COD Fee:</span>
                      <span className="font-semibold">Rs. {codFee}</span>
                    </div>
                  )}

                  {isPreOrderCart ? (
                    <div className="space-y-2.5 pt-2 border-t border-sand/80 font-sans">
                      {totalOriginalPrice > subtotal && (
                        <div className="flex justify-between text-charcoal-muted">
                          <span>Original Price:</span>
                          <span className="line-through font-mono">Rs. {totalOriginalPrice.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-teal font-semibold">
                        <span>Pre-order Price:</span>
                        <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
                      </div>
                      {youSaveDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>You Save:</span>
                          <span className="font-mono">Rs. {youSaveDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {appliedCoupon && (
                        <div className="flex justify-between text-teal font-semibold">
                          <span>Coupon Discount:</span>
                          <span className="font-mono">- Rs. {discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-charcoal-muted text-[11px]">
                        <span>Nationwide Delivery:</span>
                        <span className="font-semibold">
                          {shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-teal pt-2 border-t border-sand/80">
                        <span>Order Total:</span>
                        <span className="font-mono font-black text-lg text-teal">Rs. {totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30 space-y-2 mt-2">
                        <div className="flex justify-between text-xs text-amber-900 font-bold">
                          <span>Advance Required:</span>
                          <span className="font-mono">{effectiveAdvancePercent}%</span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-amber-950 pt-1.5 border-t border-amber-500/20">
                          <span>Pay Now:</span>
                          <span className="font-mono text-base font-black text-amber-900">
                            Rs. {preOrderAdvanceAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-teal-900">
                          <span>Remaining:</span>
                          <span className="font-mono font-bold">
                            Rs. {preOrderRemainingAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-lg font-bold text-teal pt-3 border-t border-sand/80">
                      <span>Grand Total (COD):</span>
                      <span>Rs. {totalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Submit Order Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || (isPreOrderCart && (screenshotUploading || !screenshotKey))}
                  className="w-full btn-premium btn-primary !py-4 rounded-2xl text-xs uppercase font-black tracking-widest transition-all shadow-2xl flex items-center justify-center gap-2.5 disabled:opacity-50 mt-6 border border-champagne/30 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isPreOrderCart ? 'Placing Pre-Order...' : 'Confirming Your Order...'}
                    </span>
                  ) : isPreOrderCart ? (
                    <>
                      <Lock className="w-4 h-4 text-champagne" /> Place Pre-Order (Rs. {preOrderAdvanceAmount.toLocaleString()} Advance){' '}
                      <ArrowRight className="w-4 h-4 text-champagne" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-champagne" /> Confirm Order (Cash On Delivery){' '}
                      <ArrowRight className="w-4 h-4 text-champagne" />
                    </>
                  )}
                </motion.button>

                <div className="text-[11px] text-center text-charcoal-muted space-y-1 pt-2 font-medium">
                  <p className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal shrink-0" />
                    <span>
                      {isPreOrderCart
                        ? 'Advance payment verified by finance team within 24 hours.'
                        : '7-day easy exchange guarantee across all cities in Pakistan.'}
                    </span>
                  </p>
                  <p>
                    {isPreOrderCart
                      ? 'Live WhatsApp updates sent upon verification & dispatch.'
                      : 'Express courier dispatch with discreet packaging (no family questions asked).'}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
