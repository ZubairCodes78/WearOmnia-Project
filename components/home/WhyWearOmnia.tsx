'use client';

import React from 'react';
import { Sparkles, Scissors, Banknote, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Quality Fabrics',
    description: 'We select the best materials for comfortable and durable clothing.',
  },
  {
    icon: Scissors,
    title: 'Expert Stitching',
    description: 'Each piece is carefully crafted with attention to detail.',
  },
  {
    icon: Banknote,
    title: 'Cash On Delivery',
    description: 'Pay when you receive your order. No advance payment required.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Nationwide delivery across Pakistan in 2-4 business days.',
  },
  {
    icon: ShieldCheck,
    title: 'Easy Shopping',
    description: 'No account required. Simple guest checkout process.',
  },
  {
    icon: RotateCcw,
    title: '7-Day Exchange',
    description: 'Easy exchange policy for size or style changes.',
  },
];

export const WhyWearOmnia = () => {
  return (
    <section className="py-20 bg-sand/60 border-y border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
              The WearOMNIA Difference
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-teal mt-2">
              Why Choose WearOMNIA
            </h2>
            <p className="text-sm text-charcoal-muted mt-3">
              Every garment reflects our commitment to quality and customer satisfaction.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={item.title}
                variant="fade-up"
                delay={index * 0.08}
              >
                <div className="bg-offwhite p-8 rounded-2xl border border-sand shadow-sm hover:shadow-xl hover:border-champagne/60 transition-all duration-500 group">
                  <div className="w-14 h-14 rounded-2xl bg-teal text-champagne flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-premium">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-teal mb-2 group-hover:text-champagne-700 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
