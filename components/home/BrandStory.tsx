'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

export const BrandStory: React.FC = () => {
  return (
    <section id="our-story" className="py-24 bg-offwhite border-t border-b border-sand/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Imagery Grid */}
          <ScrollReveal variant="slide-left" className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-sand/80">
              <Image
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop"
                alt="WearOMNIA Craftsmanship"
                fill
                className="object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-1/2 aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-offwhite hidden sm:block">
              <Image
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop"
                alt="Hand Embroidery Detail"
                fill
                className="object-cover object-center"
              />
            </div>
          </ScrollReveal>

          {/* Editorial Story Copy */}
          <ScrollReveal variant="slide-right" className="lg:col-span-6 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] font-semibold text-champagne-700 bg-sand/60 px-3.5 py-1 rounded-full border border-sand">
                <Sparkles className="w-3 h-3 text-champagne-700" /> The Founder's Journey
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-teal mt-3 leading-tight">
                Our Story
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans">
              <p>
                WearOMNIA began quietly on a small Instagram page. What started as a personal passion for modest luxury grew out of a simple belief: that modest fashion should never compromise on elegance, drape, or timeless quality.
              </p>
              <p>
                Rather than mass-producing collections, every single piece was personally curated, stitched, and refined in small batches. The very first clients discovered us through Instagram, trusting our vision before we even possessed a physical storefront.
              </p>
              <p>
                Word of mouth became our greatest strength. Client by client, sister by sister, women across Pakistan shared their experiences of unboxing garments crafted with patience and detail.
              </p>
              <p className="text-teal font-semibold font-serif text-base pt-2">
                Today, WearOMNIA stands at the threshold of its first official online store launch—bringing that same intimate experience directly to your doorstep.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/product/the-sovereign-velvet-kaftan"
                className="group inline-flex items-center gap-2 bg-teal text-champagne px-8 py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl"
              >
                Discover The Launch Piece <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
