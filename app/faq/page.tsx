'use client';

import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, Heart, Clock, Truck, Scissors, ShieldCheck } from 'lucide-react';

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

const FUNNY_FAQS = [
  {
    q: 'Will people ask where I bought this?',
    a: 'Inevitably, yes. WearOMNIA outfits are natural compliment magnets on campus and at family gatherings. You are completely welcome to take the credit.',
    icon: Heart,
  },
  {
    q: 'Can I wear this to an 8AM class and straight to evening plans?',
    a: 'That is the exact design brief. Our modest silhouettes and breathable coordinates are comfortable enough for campus lectures and chic enough for evening dinners without an outfit change.',
    icon: Clock,
  },
  {
    q: 'What if the rider arrives while I am in an online lecture or study session?',
    a: 'Standard drill: leave exact Cash On Delivery with someone at home or step out for thirty seconds. Our courier riders deliver swiftly and discreetly.',
    icon: Truck,
  },
  {
    q: 'Can I rewear this outfit three times in two weeks?',
    a: 'We won\'t tell anyone if you don\'t. Our pieces are specifically designed to be your go-to wardrobe favourites that look effortless every single time.',
    icon: Scissors,
  },
  {
    q: 'Why do you offer 1-click guest checkout without password requirements?',
    a: 'Because life is too short to remember another 12-character password with an uppercase letter and a number just to treat yourself to an outfit. Seamless checkout forever.',
    icon: ShieldCheck,
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [openFunnyIdx, setOpenFunnyIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="editorial-page">
      <div className="editorial-container max-w-4xl space-y-12">
        <div className="editorial-header !mb-8 space-y-2 text-center">
          <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
            Common Inquiries
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-teal tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto">
            Find quick, clear answers regarding nationwide delivery, sizing, returns, and Cash On Delivery.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-offwhite rounded-lg text-xs text-charcoal border border-champagne/50 focus:outline-none focus:ring-2 focus:ring-teal shadow-sm"
          />
          <Search className="w-5 h-5 text-teal absolute left-4 top-3.5" />
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="editorial-faq-item overflow-hidden transition-all"
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
                  className={`w-5 h-5 text-teal transition-transform ${openIdx === idx ? 'rotate-180 text-champagne-700' : ''
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

        {/* Hilarious Unofficial Real-Talk FAQs */}
        <div className="pt-10 border-t border-sand/80 space-y-6">
          <div className="text-center space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              Real Talk Corner
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-black text-teal">
              The Unofficial WearOMNIA FAQs
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto">
              A lighthearted look at Pakistani fashion realities, sister closet borrowing, and tailor-free bliss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FUNNY_FAQS.map((item, fIdx) => {
              const Icon = item.icon;
              return (
                <div
                  key={fIdx}
                  className="card-3d-subtle bg-sand/30 p-5 rounded-2xl border border-sand/80 hover:border-champagne transition-all duration-300 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-champagne/20 text-teal flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-serif text-sm font-bold text-teal leading-snug">
                        {item.q}
                      </h3>
                    </div>
                    <p className="text-xs text-charcoal-muted leading-relaxed font-sans pl-10">
                      {item.a}
                    </p>
                  </div>
                  <div className="pl-10 pt-2">
                    <span className="inline-block text-[10px] font-bold text-teal bg-champagne/30 px-2 py-0.5 rounded-full">
                      100% Desi Truth
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
