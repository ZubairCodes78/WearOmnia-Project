'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'Velvet Royale Couture',
    subtitle: 'WINTER LUXURY COLLECTION 2026',
    description: 'Immerse in opulent micro-velvet tailored with antique tilla wirework and pearl embroidery.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop',
    ctaText: 'Explore Velvet Collection',
    ctaLink: '/shop?category=velvet-couture',
  },
  {
    id: 2,
    title: 'Unstitched Luxury Lawn',
    subtitle: 'SUMMER FESTIVAL EDITION',
    description: 'Hand-finished schiffli necklines paired with 100% digital printed Bamber chiffon dupattas.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1920&auto=format&fit=crop',
    ctaText: 'Shop Unstitched Lawn',
    ctaLink: '/shop?category=unstitched-lawn',
  },
  {
    id: 3,
    title: 'The Pure Silk Edition',
    subtitle: 'SIGNATURE HAUTE COUTURE',
    description: 'Fluid raw silk shirts, hand-appliqued organza borders, and timeless regal color palettes.',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1920&auto=format&fit=crop',
    ctaText: 'Discover Silk Couture',
    ctaLink: '/shop?category=silk-edition',
  },
];

export const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const imageVariants = {
    enter: {
      opacity: 0,
      scale: 1.05,
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

  return (
    <section className="relative w-full h-[75vh] sm:h-[85vh] min-h-[480px] sm:min-h-[580px] bg-teal-950 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={SLIDES[current].id}
          variants={prefersReducedMotion ? noMotionVariants : imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={SLIDES[current].image}
            alt={SLIDES[current].title}
            fill
            priority
            className="object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay with Staggered Reveal */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-12 flex flex-col justify-center text-offwhite">
        <AnimatePresence mode="wait">
          <motion.div
            key={SLIDES[current].id}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl space-y-4 sm:space-y-6"
          >
            {/* Subtitle Badge */}
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
              }}
              className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] font-semibold text-champagne bg-teal-900/80 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-champagne/40"
            >
              {SLIDES[current].subtitle}
            </motion.span>

            {/* Title */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                exit: { opacity: 0, y: -15, transition: { duration: 0.3 } },
              }}
              className="font-serif text-3xl sm:text-6xl lg:text-7xl leading-tight font-bold tracking-tight text-offwhite"
            >
              {SLIDES[current].title}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 25 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                exit: { opacity: 0, transition: { duration: 0.2 } },
              }}
              className="text-xs sm:text-base text-offwhite/80 max-w-lg font-sans leading-relaxed line-clamp-3 sm:line-clamp-none"
            >
              {SLIDES[current].description}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: 0.65, duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                exit: { opacity: 0, transition: { duration: 0.2 } },
              }}
              className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
            >
              <Link
                href={SLIDES[current].ctaLink}
              >
                <motion.div
                  whileHover={{ translateY: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center justify-center gap-3 bg-champagne text-teal-950 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-offwhite transition-all duration-300 shadow-xl text-center"
                >
                  {SLIDES[current].ctaText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.div>
              </Link>
              <Link
                href="/shop"
              >
                <motion.div
                  whileHover={{ translateY: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-xs uppercase font-semibold tracking-widest text-offwhite border border-offwhite/40 hover:border-champagne hover:text-champagne transition-all duration-300 text-center"
                >
                  View Full Catalog
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrent(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ease-premium ${
              current === idx ? 'w-10 bg-champagne' : 'w-3 bg-offwhite/40 hover:bg-offwhite/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
