'use client';

import React from 'react';
import { Scissors, Banknote, Truck, ShieldCheck, RotateCcw, Clock, Coffee, Heart, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

const FEATURES = [
  {
    tag: 'FOR THE 8AM CLASS.',
    title: 'Wrinkle-Resistant Fabrics',
    description: 'Breathable, durable, and ready straight from the hanger so you can roll out of bed and still look impeccably put-together.',
    icon: Clock,
  },
  {
    tag: 'FOR THE "JUST GRAB CHAI" PLAN.',
    title: 'Effortless Coordinates',
    description: 'Elevated cuts and flowing tailoring that transition seamlessly from campus lectures to casual chai breaks without missing a beat.',
    icon: Coffee,
  },
  {
    tag: 'FOR FAMILY DINNERS.',
    title: 'Graceful Modest Perfection',
    description: 'Flattering silhouettes with generous coverage that keep you comfortable while earning genuine “Where did you get this?” compliments.',
    icon: Heart,
  },
  {
    tag: 'FOR "I’LL JUST WEAR SOMETHING SIMPLE".',
    title: 'Timeless Capsule Pieces',
    description: 'Because the simplest outfits are the ones you end up wearing three times a week. Hand-finished details that never fade.',
    icon: Scissors,
  },
  {
    tag: 'BEFORE THE ASSIGNMENT DEADLINE.',
    title: 'Nationwide Express Delivery',
    description: 'Carefully packaged and delivered across Pakistan in 2–4 business days with instant Cash On Delivery. Zero advance hassle.',
    icon: Truck,
  },
  {
    tag: 'ZERO WARDROBE REGRET.',
    title: '7-Day Easy Exchange',
    description: 'If the size or fit isn’t 100% perfect, swap it within 7 days with zero friction. Personal sizing assistance right on WhatsApp.',
    icon: RotateCcw,
  },
];

export const WhyWearOmnia = () => {
  return (
    <section className="py-20 bg-sand/40 border-y border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              The Daily Outfit Solution
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-teal tracking-tight">
              Why WearOMNIA?
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
              For days when you have 10 minutes to get ready and somehow still want to look like you planned the outfit.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={item.tag}
                variant="fade-up"
                delay={index * 0.08}
              >
                <div className="card-3d bg-offwhite p-7 sm:p-8 rounded-2xl border border-sand/80 shadow-sm hover:shadow-2xl hover:border-champagne/60 group flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-teal text-champagne flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-teal-900 transition-all duration-500 shadow-md border border-champagne/30">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-extrabold text-champagne-700 block mb-1">
                      {item.tag}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-teal mb-2 group-hover:text-champagne-700 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Real-Life Campus & Modesty Promise Banner */}
        <ScrollReveal variant="fade-up" delay={0.3}>
          <div className="mt-14 bg-teal text-offwhite rounded-3xl p-6 sm:p-10 border border-champagne/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-champagne/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center lg:text-left">
                <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-champagne block">
                  The Everyday Real-Life Promise
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-black text-champagne">
                  Designed For Real Days, Not Just Mannequins.
                </h3>
                <p className="text-xs sm:text-sm text-offwhite/85 max-w-xl leading-relaxed">
                  Thoughtfully tailored modest pieces designed to survive campus walks, long lectures, impromptu chai plans, and the eternal daily mystery of what to wear.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full lg:w-auto shrink-0">
                <div className="bg-teal-950/90 border border-champagne/30 p-4 rounded-2xl text-center space-y-1 shadow-md">
                  <div className="w-8 h-8 mx-auto rounded-full bg-champagne/15 text-champagne flex items-center justify-center mb-1.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-champagne">Effortless Modesty</div>
                  <div className="text-[11px] text-offwhite/75 leading-tight">Generous drape &amp; easy dupatta styling</div>
                </div>
                <div className="bg-teal-950/90 border border-champagne/30 p-4 rounded-2xl text-center space-y-1 shadow-md">
                  <div className="w-8 h-8 mx-auto rounded-full bg-champagne/15 text-champagne flex items-center justify-center mb-1.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-champagne">Express COD</div>
                  <div className="text-[11px] text-offwhite/75 leading-tight">Arrives before your next assignment deadline</div>
                </div>
                <div className="bg-teal-950/90 border border-champagne/30 p-4 rounded-2xl text-center space-y-1 shadow-md">
                  <div className="w-8 h-8 mx-auto rounded-full bg-champagne/15 text-champagne flex items-center justify-center mb-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-champagne">Zero Tailor Hassle</div>
                  <div className="text-[11px] text-offwhite/75 leading-tight">100% ready-to-wear straight out of the box</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
