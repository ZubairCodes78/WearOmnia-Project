'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

export const BrandStory: React.FC = () => {
  return (
    <section id="our-story" className="py-24 bg-offwhite border-t border-b border-sand/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Imagery Grid with 3D Overlapping Frames */}
          <ScrollReveal variant="slide-left" className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-2 border-sand/80 card-3d">
              <Image
                src="/images/kaftan-1.jpg"
                alt="WearOMNIA Craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                quality={85}
                className="object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-1/2 aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-offwhite hidden sm:block card-3d">
              <Image
                src="/images/kaftan-2.jpg"
                alt="Hand Embroidery Detail"
                fill
                sizes="25vw"
                loading="lazy"
                quality={85}
                className="object-cover object-center"
              />
            </div>
          </ScrollReveal>

          {/* Editorial Story Copy (Short Story Summary) */}
          <ScrollReveal variant="slide-right" className="lg:col-span-6 space-y-6">
            <div className="space-y-1">
              <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
                A Passion for Grace &amp; Modesty
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-black text-teal leading-tight">
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
            <div className="bg-sand/60 border-l-4 border-teal p-3.5 rounded-r-2xl text-xs text-charcoal flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs leading-relaxed text-charcoal">
                <strong className="text-teal font-bold">The Honest Truth:</strong> When your outfit is this effortlessly good, people will inevitably ask where you got it. We&apos;ll let you take the credit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/our-story"
                className="group inline-flex items-center gap-2 bg-teal text-champagne px-7 py-4 rounded-xl text-xs uppercase font-extrabold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl border border-champagne/30 cursor-pointer btn-3d"
              >
                Read Our Full Story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-sand/80 hover:bg-sand text-teal px-6 py-4 rounded-xl text-xs uppercase font-bold tracking-widest transition-all duration-300 border border-sand shadow-sm hover:-translate-y-0.5"
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
