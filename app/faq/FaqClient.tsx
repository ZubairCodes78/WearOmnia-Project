'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, HelpCircle, Heart, Clock, Truck, Scissors, ShieldCheck } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

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
    a: "We won't tell anyone if you don't. Our pieces are specifically designed to be your go-to wardrobe favourites that look effortless every single time.",
    icon: Scissors,
  },
  {
    q: 'Why do you offer 1-click guest checkout without password requirements?',
    a: 'Because life is too short to remember another 12-character password with an uppercase letter and a number just to treat yourself to an outfit. Seamless checkout forever.',
    icon: ShieldCheck,
  },
];

interface FaqItemProp {
  question: string;
  answer: string;
}

export default function FaqClient({ faqs: serverFaqs = [] }: { faqs?: FaqItemProp[] }) {
  const { settings } = useSettings();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedFaqs = serverFaqs.map((f) => ({ q: f.question, a: f.answer }));

  const filteredFaqs = normalizedFaqs.filter(
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
            Direct answers about Cash on Delivery, Full Advance Payment verification, sizing, tracking, and 7-day exchanges across Pakistan.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <label htmlFor="faq-search-input" className="sr-only">
            Search Frequently Asked Questions
          </label>
          <input
            id="faq-search-input"
            type="text"
            placeholder="Search questions (COD, full advance, delivery, size)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-offwhite rounded-lg text-xs text-charcoal border border-champagne/50 focus:outline-none focus:ring-2 focus:ring-teal shadow-sm"
          />
          <Search className="w-5 h-5 text-teal absolute left-4 top-3.5" aria-hidden="true" />
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const panelId = `faq-panel-${idx}`;
            return (
              <div
                key={idx}
                className="editorial-faq-item overflow-hidden transition-all"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-base font-semibold text-teal cursor-pointer min-h-[44px]"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-champagne-700 shrink-0" aria-hidden="true" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`w-5 h-5 text-teal transition-transform shrink-0 ${isOpen ? 'rotate-180 text-champagne-700' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    className="px-6 pb-6 text-xs text-charcoal-muted font-sans leading-relaxed border-t border-sand/60 pt-4"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Helpful Direct Internal Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          <Link href="/shop" className="px-4 py-2 rounded-xl bg-teal text-champagne hover:bg-teal-900 transition-colors">
            Browse Collection
          </Link>
          <Link href="/track-order" className="px-4 py-2 rounded-xl bg-sand text-teal hover:border-champagne border border-sand transition-colors">
            Track Order
          </Link>
          <Link href="/size-guide" className="px-4 py-2 rounded-xl bg-sand text-teal hover:border-champagne border border-sand transition-colors">
            Size Guide
          </Link>
          <Link href="/policies/shipping" className="px-4 py-2 rounded-xl bg-sand text-teal hover:border-champagne border border-sand transition-colors">
            Shipping Policy
          </Link>
          <Link href="/policies/returns" className="px-4 py-2 rounded-xl bg-sand text-teal hover:border-champagne border border-sand transition-colors">
            Returns Policy
          </Link>
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
