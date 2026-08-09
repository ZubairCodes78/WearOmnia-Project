import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">Data Protection</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal">Privacy Policy</h1>
        </div>
        <div className="bg-sand/60 p-8 rounded-3xl border border-sand space-y-4 text-xs text-charcoal leading-relaxed font-sans">
          <p>
            At WearOMNIA, we value customer privacy. Because we operate on a <strong>Guest Checkout Only</strong> model, we only collect information required to fulfill your Cash On Delivery orders across Pakistan (Full Name, Delivery Address, Phone Number).
          </p>
          <p>
            We never store passwords, credit card credentials, or personal tracking cookies for third-party resale. Your contact info is strictly used for order dispatch, courier coordination, and WhatsApp delivery notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
