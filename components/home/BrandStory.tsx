'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

export const BrandStory: React.FC = () => {
  return (
    <section id="our-story" className="py-20 sm:py-24 bg-offwhite border-t border-b border-sand/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Imagery Column: Single balanced hero image */}
          <ScrollReveal variant="slide-left" className="lg:col-span-6">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-sand/80 max-w-lg mx-auto lg:max-w-none">
              <Image
                src="/images/kaftan-1.jpg"
                alt="WearOMNIA Atelier Craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                quality={85}
                className="object-cover object-center"
              />
            </div>
          </ScrollReveal>

          {/* Editorial Story Copy */}
          <ScrollReveal variant="slide-right" className="lg:col-span-6 space-y-6 sm:space-y-7">
            <div className="space-y-2">
              <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
                A Passion for Grace &amp; Modesty
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-teal leading-tight tracking-tight">
                Our Story &amp; Heritage
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans">
              <p>
                We started WearOMNIA because <strong className="text-teal font-semibold">&ldquo;I have nothing to wear&rdquo;</strong> somehow became a daily morning crisis before university.
              </p>
              <p>
                Getting dressed shouldn’t feel like an exam. We believe modest fashion should be effortless — beautiful breathable fabrics, flowing drapes, and flawless tailoring that make you look put-together in under ten minutes.
              </p>
              <p className="text-teal font-serif font-bold text-sm sm:text-base pt-1">
                Handcrafted in limited batches by master Pakistani artisans. Made to be worn on repeat, celebrated on campus, and loved at family gatherings.
              </p>
            </div>

            {/* Relatable Wardrobe Note */}
            <div className="bg-sand/50 border-l-3 border-teal p-3.5 sm:p-4 rounded-r-xl text-xs text-charcoal flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <p className="text-[11.5px] sm:text-xs leading-relaxed text-charcoal">
                <strong className="text-teal font-bold">The Honest Truth:</strong> When your outfit is this effortlessly good, people will inevitably ask where you got it. We&apos;ll let you take the credit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/our-story"
                className="group inline-flex items-center gap-2 bg-teal text-champagne px-7 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-md border border-champagne/30 cursor-pointer"
              >
                Read Our Full Story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-sand/80 hover:bg-sand text-teal px-6 py-3.5 rounded-xl text-xs uppercase font-bold tracking-widest transition-all duration-300 border border-sand shadow-xs hover:-translate-y-0.5"
              >
                Explore Catalog
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
