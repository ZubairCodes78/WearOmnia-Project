'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Scissors, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    badge: 'Ready to Wear',
    kicker: 'Modest Luxury Couture',
    titlePrefix: 'Modest enough for uni.',
    titleHighlight: 'Pretty enough for the “where did you get that?”',
    description:
      'Thoughtfully designed modest pieces for university days, chai runs, family dinners and everything in between.',
    image: '/images/hero-1.jpg',
    ctaText: 'Find Your Next Outfit',
    ctaLink: '/shop',
    vibeTab: 'Uni & Everyday',
  },
  {
    id: 2,
    badge: '8AM Class Tested',
    kicker: 'Effortless Put-Together',
    titlePrefix: 'Your 8AM class called.',
    titleHighlight: 'It wants you to look this put-together.',
    description:
      'Wrinkle-resistant fabrics and breathable modest silhouettes designed to survive back-to-back lectures and impromptu campus plans.',
    image: '/images/hero-2.jpg',
    ctaText: 'Shop The Collection',
    ctaLink: '/shop',
    vibeTab: '8AM Class Ready',
  },
  {
    id: 3,
    badge: 'Wardrobe Essentials',
    kicker: 'The Rewear Confidence',
    titlePrefix: 'Because “I have nothing to wear”',
    titleHighlight: 'is not a personality trait.',
    description:
      'Elevated coordinates and signature silhouettes you will reach for again and again. Graceful, comfortable, undeniably chic.',
    image: '/images/kaftan-1.jpg',
    ctaText: 'Explore All Outfits',
    ctaLink: '/shop',
    vibeTab: 'Wear On Repeat',
  },
];

export const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const imageVariants = {
    enter: {
      opacity: 0,
      scale: 1.04,
    },
    center: {
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] as const },
        scale: { duration: 7, ease: 'linear' as const },
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  const noMotionVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const slide = SLIDES[current];

  return (
    <section className="relative w-full min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] bg-[#06191B] overflow-hidden flex flex-col justify-between border-b border-champagne/15">
      {/* Background Slides with Ambient Gradient Overlays */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          variants={prefersReducedMotion ? noMotionVariants : imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={slide.image}
            alt={`${slide.titlePrefix} ${slide.titleHighlight}`}
            fill
            priority
            className="object-cover object-center opacity-40 sm:opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06191B] via-[#06191B]/85 sm:via-[#06191B]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06191B] via-transparent to-[#06191B]/40" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex-1 flex items-center">
        <div className="max-w-2xl lg:max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-col items-start"
            >
              {/* 1. Small Label / Eyebrow */}
              <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                <span className="text-[10.5px] sm:text-xs uppercase tracking-[0.24em] font-semibold text-champagne">
                  {slide.badge}
                </span>
                <span className="w-1 h-1 rounded-full bg-champagne/40" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-offwhite/60 font-medium">
                  {slide.kicker}
                </span>
              </div>

              {/* 2. Main Heading */}
              <h1 className="text-2xl sm:text-3xl lg:text-[2.6rem] font-medium text-offwhite tracking-tight leading-[1.3] sm:leading-[1.34] max-w-2xl drop-shadow-sm">
                <span className="block font-serif font-bold">{slide.titlePrefix}</span>
                <span className="font-italic-luxury text-champagne font-normal text-[1.12em] block mt-1.5 sm:mt-2">
                  {slide.titleHighlight}
                </span>
              </h1>

              {/* 3. Supporting Text */}
              <p className="mt-4 sm:mt-6 text-xs sm:text-sm lg:text-[15px] text-offwhite/85 max-w-xl font-sans leading-relaxed tracking-normal">
                {slide.description}
              </p>

              {/* 4. CTA Button Group */}
              <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <Link href={slide.ctaLink} className="inline-block">
                  <span className="group flex items-center justify-center gap-2.5 bg-champagne text-teal-950 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs uppercase font-bold tracking-[0.16em] hover:bg-offwhite transition-all duration-300 shadow-md text-center border border-champagne/40 cursor-pointer">
                    {slide.ctaText}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>

                <Link href="/shop" className="inline-block">
                  <span className="block px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs uppercase font-medium tracking-[0.16em] text-offwhite/90 bg-teal-950/60 backdrop-blur-sm border border-champagne/30 hover:border-champagne hover:text-champagne transition-all duration-300 text-center cursor-pointer">
                    Browse Collection
                  </span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Vibe Switcher Tabs + Progress Indicator */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-t border-champagne/15 pt-4 sm:pt-5">
          {/* Horizontal Mood Pills */}
          <div className="w-full sm:w-auto min-w-0 flex items-center">
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-1 px-0.5 scroll-smooth select-none pr-4 sm:pr-0"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-champagne/70 shrink-0 mr-1 select-none">
                Vibes:
              </span>
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(idx)}
                  className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 cursor-pointer shrink-0 border select-none inline-flex items-center gap-1.5 ${
                    current === idx
                      ? 'bg-champagne text-teal-950 border-champagne font-bold shadow-sm'
                      : 'bg-teal-950/40 text-offwhite/75 border-white/10 hover:border-champagne/40 hover:text-offwhite'
                  }`}
                >
                  {current === idx && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-950 shrink-0" />
                  )}
                  {s.vibeTab}
                </button>
              ))}
            </div>
          </div>

          {/* Slide Progress Indicator */}
          <div className="flex items-center gap-3 shrink-0 self-center sm:self-auto pt-0.5 sm:pt-0">
            <div className="flex items-center gap-1.5">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to slide ${idx + 1}: ${s.vibeTab}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    current === idx
                      ? 'w-7 sm:w-8 h-1.5 bg-champagne'
                      : 'w-2 sm:w-2.5 h-1.5 bg-offwhite/30 hover:bg-offwhite/60'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-champagne/70 font-semibold tracking-wider hidden sm:inline-block">
              0{current + 1} / 0{SLIDES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Reassurance Strip */}
      <div className="relative z-20 bg-[#041517] border-t border-champagne/15 py-3 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex flex-nowrap items-center justify-start sm:justify-between gap-6 sm:gap-4 text-[11px] font-medium text-offwhite/80 min-w-max sm:min-w-0">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-champagne" />
            <span>Nationwide Express COD (2-4 Days)</span>
          </div>
          <div className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-champagne" />
            <span>0% Tailor Drama • Ready to Wear</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-champagne" />
            <span>7-Day Easy Exchange Policy</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
            <span>Guest Checkout • No Account Needed</span>
          </div>
        </div>
      </div>
    </section>
  );
};
