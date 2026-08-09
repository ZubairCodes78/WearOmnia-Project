'use client';

import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Do I need an account to place an order?',
    a: 'No! WearOMNIA enforces a strict Guest Checkout model. You never need to register or create an account. Simply add items to your bag, enter your shipping details, and place your order in seconds.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We strictly offer Cash On Delivery (COD) across 200+ cities in Pakistan. You pay in cash to the courier representative when your parcel is handed over.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Major cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad) receive deliveries within 2-3 business days. Other cities and interior regions take 3-5 business days.',
  },
  {
    q: 'Is shipping free?',
    a: 'Yes, nationwide shipping is completely FREE on all orders of Rs. 10,000 or above. For orders under Rs. 10,000, a flat delivery fee of Rs. 250 is added.',
  },
  {
    q: 'What is the unstitched suit fabric composition?',
    a: 'Our unstitched lawn collections feature high-count 80/80 printed lawn shirts, schiffli embroidered neck patches, and 100% Bamber chiffon or pure silk dupattas.',
  },
  {
    q: 'Can I exchange an item if it doesn’t fit?',
    a: 'Yes, we provide a 7-day hassle-free exchange window. Simply contact our WhatsApp concierge (03180633323) or email us at wearomniaa@gmail.com with your order number.',
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
            Common Inquiries
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal">Frequently Asked Questions</h1>
          <p className="text-xs text-charcoal-muted font-sans">Find instant answers regarding COD, delivery, and suit care.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-sand rounded-2xl text-xs text-charcoal border border-sand focus:outline-none focus:ring-2 focus:ring-teal shadow-inner"
          />
          <Search className="w-5 h-5 text-teal absolute left-4 top-3.5" />
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-sand/60 rounded-2xl border border-sand overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-base font-semibold text-teal"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-champagne-700 shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-teal transition-transform ${
                    openIdx === idx ? 'rotate-180 text-champagne-700' : ''
                  }`}
                />
              </button>

              {openIdx === idx && (
                <div className="px-6 pb-6 text-xs text-charcoal-muted font-sans leading-relaxed border-t border-sand/60 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
