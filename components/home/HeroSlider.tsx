'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Scissors, ShieldCheck, Truck, RotateCcw, Heart, CheckCircle2, Clock, Coffee } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    badge: 'READY IN 5 MINUTES',
    kicker: 'MODEST LUXURY COUTURE',
    title: 'Modest enough for uni. Pretty enough for the “where did you get that?”',
    titlePrefix: 'Modest enough for uni.',
    titleHighlight: 'Pretty enough for the “where did you get that?”',
    description:
      'Thoughtfully designed modest pieces for university days, chai runs, family dinners and everything in between.',
    image: '/images/hero-1.jpg',
    ctaText: 'Find Your Next Outfit',
    ctaLink: '/shop',
    vibeTab: 'Uni & Everyday',
    humorCard: {
      icon: Clock,
      tag: 'CAMPUS RELATABILITY',
      title: 'Effortless Mornings',
      quote: '“Looks like you planned the outfit for hours. We’ll let you take the credit.”',
      stat: '100% Stitched • 0 Tailor Drama',
      substat: 'Doorstep COD delivery across Pakistan',
    },
  },
  {
    id: 2,
    badge: '8AM CLASS TESTED',
    kicker: 'EFFORTLESS PUT-TOGETHER',
    title: 'Your 8AM class called. It wants you to look this put-together.',
    titlePrefix: 'Your 8AM class called.',
    titleHighlight: 'It wants you to look this put-together.',
    description:
      'Wrinkle-resistant fabrics and breathable modest silhouettes designed to survive back-to-back lectures and impromptu campus plans.',
    image: '/images/hero-2.jpg',
    ctaText: 'Shop The Collection',
    ctaLink: '/shop',
    vibeTab: '8AM Class Ready',
    humorCard: {
      icon: Coffee,
      tag: 'ATTENDANCE STANDARD',
      title: 'Zero Outfit Stress',
      quote: '“Late to class, but never late to serving effortless looks.”',
      stat: 'Breathable Comfort • Flowing Drape',
      substat: 'Cash On Delivery with easy 7-day exchange',
    },
  },
  {
    id: 3,
    badge: 'WARDROBE ESSENTIALS',
    kicker: 'THE REWEAR CONFIDENCE',
    title: 'Because “I have nothing to wear” is not a personality trait.',
    titlePrefix: 'Because “I have nothing to wear”',
    titleHighlight: 'is not a personality trait.',
    description:
      'Elevated coordinates and signature silhouettes you will reach for again and again. Graceful, comfortable, undeniably chic.',
    image: '/images/kaftan-1.jpg',
    ctaText: 'Explore All Outfits',
    ctaLink: '/shop',
    vibeTab: 'Wear On Repeat',
    humorCard: {
      icon: Scissors,
      tag: 'DAILY ROTATION',
      title: 'The Go-To Favourite',
      quote: '“Apparently wearing your favourite outfit three times a week is frowned upon. So here’s your new one.”',
      stat: '10,000+ Happy Customers • 4.9 ★',
      substat: 'Nationwide Express 2-4 Days',
    },
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
      scale: 1.06,
    },
    center: {
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 1, ease: [0.16, 1, 0.3, 1] as const },
        scale: { duration: 7, ease: 'linear' as const },
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.6 },
    },
  };

  const noMotionVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const slide = SLIDES[current];

  return (
    <section className="relative w-full min-h-[580px] sm:min-h-[620px] lg:min-h-[640px] bg-[#06191B] overflow-hidden flex flex-col justify-between border-b border-champagne/20">
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
            alt={slide.title}
            fill
            priority
            className="object-cover object-center opacity-45 sm:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06191B] via-[#06191B]/80 sm:via-[#06191B]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06191B] via-transparent to-[#06191B]/30" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Humorous Catchy Hero Copy */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3.5 sm:space-y-4"
              >
                {/* Witty Pill Badge & Kicker */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-extrabold text-teal-950 bg-champagne px-3 py-1 rounded-full shadow-md border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-950" />
                    {slide.badge}
                  </span>
                  <span className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.2em] text-champagne/90 font-bold">
                    {slide.kicker}
                  </span>
                </div>

                {/* Humorous Punchy Headline - Attractive & Smaller */}
                <h1 className="text-xl sm:text-2xl lg:text-[2.1rem] font-semibold text-offwhite tracking-tight leading-[1.26] max-w-xl drop-shadow-md">
                  <span className="block">{slide.titlePrefix}</span>
                  <span className="font-italic-luxury text-champagne font-normal text-[1.12em] tracking-normal inline-block mt-0.5">
                    {slide.titleHighlight}
                  </span>
                </h1>

                {/* Relatable Pakistani Fashion Description */}
                <p className="text-xs sm:text-[13px] text-offwhite/80 max-w-md font-sans leading-relaxed font-normal drop-shadow-sm">
                  {slide.description}
                </p>

                {/* Dual Action CTAs */}
                <div className="pt-2 sm:pt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link href={slide.ctaLink}>
                    <motion.div
                      whileHover={{ translateY: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="group flex items-center justify-center gap-2 bg-champagne text-teal-950 px-5 sm:px-6 py-2.5 rounded-xl text-[10.5px] uppercase font-bold tracking-widest hover:bg-offwhite transition-all duration-300 shadow-xl text-center border border-champagne/40 cursor-pointer btn-3d"
                    >
                      {slide.ctaText}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </motion.div>
                  </Link>

                  <Link href="/shop">
                    <motion.div
                      whileHover={{ translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 sm:px-6 py-2.5 rounded-xl text-[10.5px] uppercase font-bold tracking-widest text-offwhite bg-teal-900/60 backdrop-blur-md border border-champagne/30 hover:border-champagne hover:text-champagne transition-all duration-300 text-center cursor-pointer shadow-md"
                    >
                      Browse Entire Catalog
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Interactive 3D Social Proof / Humor Floating Glass Card — desktop only */}
          <div className="hidden lg:flex lg:col-span-5 justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[390px] bg-[#0A2528]/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-champagne/35 shadow-2xl space-y-3 relative overflow-hidden card-3d"
              >
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-champagne/10 rounded-full blur-2xl pointer-events-none" />

                {/* Header Tag */}
                <div className="flex items-center justify-between border-b border-champagne/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-champagne/20 text-champagne flex items-center justify-center">
                      <slide.humorCard.icon className="w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-champagne">
                      {slide.humorCard.tag}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Verified
                  </span>
                </div>

                {/* Witty Card Title & Relatable Quote */}
                <div className="space-y-1.5">
                  <h3 className="font-sans text-sm sm:text-[15px] font-bold text-offwhite tracking-tight">
                    {slide.humorCard.title}
                  </h3>
                  <div className="bg-[#041517]/85 p-3 rounded-xl border border-champagne/25 shadow-inner">
                    <p className="font-italic-luxury text-sm sm:text-[15px] text-[#F7EFE4] leading-relaxed tracking-wide">
                      {slide.humorCard.quote}
                    </p>
                  </div>
                </div>

                {/* Micro Stat Highlights */}
                <div className="pt-0.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-sans font-bold text-[12px] text-champagne">
                      {slide.humorCard.stat}
                    </div>
                    <div className="text-[9.5px] text-offwhite/70">
                      {slide.humorCard.substat}
                    </div>
                  </div>

                  <Link
                    href="/shop"
                    className="text-[10px] font-bold text-champagne hover:text-offwhite underline flex items-center gap-1 shrink-0 transition-colors"
                  >
                    Get Yours <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Interactive Vibe Switcher Tabs + Indicators */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-t border-champagne/15 pt-4 sm:pt-5">
          {/* Horizontal Swipeable Mood Pills */}
          <div className="w-full sm:w-auto min-w-0 flex items-center">
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-1.5 px-0.5 scroll-smooth select-none pr-4 sm:pr-0"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <span className="text-[9.5px] sm:text-[10px] uppercase font-extrabold tracking-widest text-champagne/75 shrink-0 mr-1 select-none">
                Browse Vibes:
              </span>
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(idx)}
                  className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold transition-all duration-300 cursor-pointer shrink-0 border select-none inline-flex items-center gap-1.5 ${
                    current === idx
                      ? 'bg-champagne text-teal-950 border-champagne shadow-md font-extrabold'
                      : 'bg-teal-900/40 text-offwhite/80 border-white/10 hover:border-champagne/50 hover:text-offwhite'
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

          {/* Intentional Slide Progress Indicator */}
          <div className="flex items-center gap-3 shrink-0 self-center sm:self-auto pt-0.5 sm:pt-0">
            <div className="flex items-center gap-1.5">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to slide ${idx + 1}: ${s.vibeTab}`}
                  className={`rounded-full transition-all duration-400 cursor-pointer ${
                    current === idx
                      ? 'w-7 sm:w-8 h-1.5 sm:h-2 bg-champagne shadow-[0_0_8px_rgba(223,195,160,0.5)]'
                      : 'w-2 sm:w-2.5 h-1.5 sm:h-2 bg-offwhite/30 hover:bg-offwhite/60'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-champagne/80 font-bold tracking-wider hidden sm:inline-block">
              0{current + 1} / 0{SLIDES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Reassurance Strip */}
      <div className="relative z-20 bg-[#041517] border-t border-champagne/20 py-2.5 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex flex-nowrap items-center justify-start sm:justify-between gap-4 sm:gap-3 text-[11px] font-semibold text-offwhite/80 min-w-max sm:min-w-0">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-champagne" />
            <span>Nationwide Express COD (2-4 Days)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-champagne" />
            <span>0% Tailor Drama • Ready to Wear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-champagne" />
            <span>7-Day Easy Exchange Policy</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
            <span>Guest Checkout • No Account Needed</span>
          </div>
        </div>
      </div>
    </section>
  );
};
