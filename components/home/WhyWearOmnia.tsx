'use client';

import React from 'react';
import { Scissors, Truck, ShieldCheck, RotateCcw, Clock, Coffee, Heart, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/layout/ScrollReveal';
import { useSettings } from '@/context/SettingsContext';

export const WhyWearOmnia = () => {
  const { settings } = useSettings();

  const features = [
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
      description: `Carefully packaged and delivered across Pakistan in ${settings.estimatedDeliveryTime || '2–4 business days'} with secure Cash On Delivery and transparent order tracking.`,
      icon: Truck,
    },
    {
      tag: 'ZERO WARDROBE REGRET.',
      title: '7-Day Easy Exchange',
      description: 'If the size or fit isn’t 100% perfect, swap it within 7 days with zero friction. Personal sizing assistance right on WhatsApp.',
      icon: RotateCcw,
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-sand/35 border-y border-sand/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              The Daily Outfit Solution
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-teal tracking-tight">
              Why WearOMNIA?
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
              For days when you have 10 minutes to get ready and somehow still want to look like you planned the outfit.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={item.tag}
                variant="fade-up"
                delay={index * 0.06}
              >
                <div className="bg-offwhite p-6 sm:p-7 rounded-2xl border border-sand/80 shadow-xs hover:border-champagne/60 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-full">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-teal text-champagne flex items-center justify-center mb-4 transition-colors duration-300 border border-champagne/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] font-bold text-champagne-700 block mb-1">
                      {item.tag}
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-teal mb-2 group-hover:text-champagne-700 transition-colors duration-300">
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
        <ScrollReveal variant="fade-up" delay={0.25}>
          <div className="mt-12 sm:mt-16 bg-teal text-offwhite rounded-2xl sm:rounded-3xl p-6 sm:p-9 border border-champagne/25 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center lg:text-left">
                <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-champagne block">
                  The Everyday Real-Life Promise
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-champagne tracking-tight">
                  Designed For Real Days, Not Just Mannequins.
                </h3>
                <p className="text-xs sm:text-sm text-offwhite/85 max-w-xl leading-relaxed">
                  Thoughtfully tailored modest pieces designed to survive campus walks, long lectures, impromptu chai plans, and the eternal daily mystery of what to wear.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
                <div className="bg-teal-950/80 border border-champagne/25 p-3.5 sm:p-4 rounded-xl text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-champagne/15 text-champagne flex items-center justify-center mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-champagne">Effortless Modesty</div>
                  <div className="text-[11px] text-offwhite/75 leading-tight">Generous drape &amp; easy dupatta styling</div>
                </div>
                <div className="bg-teal-950/80 border border-champagne/25 p-3.5 sm:p-4 rounded-xl text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-champagne/15 text-champagne flex items-center justify-center mb-1">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-champagne">Express COD</div>
                  <div className="text-[11px] text-offwhite/75 leading-tight">Arrives in 2-4 business days</div>
                </div>
                <div className="bg-teal-950/80 border border-champagne/25 p-3.5 sm:p-4 rounded-xl text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-champagne/15 text-champagne flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-xs text-champagne">Zero Tailor Hassle</div>
                  <div className="text-[11px] text-offwhite/75 leading-tight">100% ready-to-wear stitched</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
