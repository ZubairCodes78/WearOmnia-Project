'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Scissors, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface SlideData {
  id: number;
  image: string;
  alt: string;
  ctaText: string;
  ctaLink: string;
  objectPosition: string;
  ctaPositionClasses: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    image: '/1 slider.jpeg',
    alt: 'The Ease Edit - WearOMNIA',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    objectPosition: 'object-center',
    // Placed in open area to the right below the artwork text
    ctaPositionClasses: 'right-3 sm:right-[8%] lg:right-[12%] bottom-3 sm:bottom-[10%] lg:bottom-[13%]',
  },
  {
    id: 2,
    image: '/2 slider.jpeg',
    alt: 'Gulistan Collection - WearOMNIA',
    ctaText: 'Shop Collection',
    ctaLink: '/shop',
    objectPosition: 'object-center',
    // Placed below "Gulistan COLLECTION" text on the right
    ctaPositionClasses: 'right-3 sm:right-[8%] lg:right-[12%] bottom-3 sm:bottom-[10%] lg:bottom-[13%]',
  },
  {
    id: 3,
    image: '/3 slider.jpeg',
    alt: 'WearOMNIA Pre-Booking Is Now Live',
    ctaText: 'Pre-Order Now',
    ctaLink: '/shop?preorder=true',
    objectPosition: 'object-center',
    // Centered horizontally below "PRE-BOOKING IS NOW LIVE!"
    ctaPositionClasses: 'left-1/2 -translate-x-1/2 bottom-3 sm:bottom-[9%] lg:bottom-[12%]',
  },
];

export const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 6500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const slide = SLIDES[current];

  return (
    <section
      aria-label="Featured Collections"
      className="relative w-full bg-[#06191B] overflow-hidden flex flex-col justify-between border-b border-champagne/15 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Responsive Aspect Ratio Stage - Exact 1920x800 (2.4:1) banner ratio to eliminate cropping */}
      <div className="relative w-full aspect-[1920/800] max-h-[800px] overflow-hidden">
        {/* Background Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={slide.id === 1}
              sizes="100vw"
              quality={85}
              className={`object-cover ${slide.objectPosition}`}
            />
          </motion.div>
        </AnimatePresence>

        {/* Real HTML CTA Button - Positioned Intelligently per Artwork */}
        <div className={`absolute z-20 ${slide.ctaPositionClasses}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Link href={slide.ctaLink} className="inline-block">
                <span className="group flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-[#06191B]/90 hover:bg-[#06191B] text-champagne hover:text-offwhite border border-champagne/60 hover:border-champagne text-[11px] sm:text-xs uppercase font-bold tracking-[0.14em] sm:tracking-[0.16em] transition-all duration-300 shadow-xl backdrop-blur-xs cursor-pointer">
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-2 sm:bottom-4 left-3 sm:left-8 z-20 flex items-center gap-1.5 sm:gap-2">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                current === idx
                  ? 'w-5 sm:w-8 bg-champagne'
                  : 'w-1.5 sm:w-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
          <span className="text-[9px] sm:text-[10px] font-mono text-champagne/80 font-bold ml-1 hidden sm:inline-block">
            0{current + 1} / 0{SLIDES.length}
          </span>
        </div>
      </div>

      {/* Bottom Reassurance Strip */}
      <div className="relative z-20 bg-[#041517] border-t border-champagne/15 py-2.5 sm:py-3 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex flex-nowrap items-center justify-start sm:justify-between gap-6 sm:gap-4 text-[11px] font-medium text-offwhite/85 min-w-max sm:min-w-0">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-champagne" />
            <span>Nationwide Express COD (2-4 Days)</span>
          </div>
          <div className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-champagne" />
            <span>Ready to Wear • No Tailor Hassle</span>
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
