'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section
      id="our-story"
      aria-label="Our Story & Heritage"
      className="py-16 sm:py-24 lg:py-28 bg-offwhite border-t border-b border-sand/80 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-sand/30 border border-sand/90 p-8 sm:p-14 lg:p-18 shadow-xs">
          {/* Wide, spacious horizontal editorial composition on desktop; stacked on mobile */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 sm:gap-10 lg:gap-16">
            {/* Left Column: Eyebrow + Main Heading */}
            <div className="lg:max-w-xl space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-champagne-600/60" />
                <span className="font-sans text-[11px] sm:text-xs text-champagne-700 tracking-[0.28em] uppercase font-bold">
                  OUR STORY
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-teal leading-[1.18] tracking-tight">
                Rooted In Heritage.
                <span className="block mt-1 sm:mt-2 text-teal-800">
                  Designed For Today.
                </span>
              </h2>
            </div>

            {/* Right Column: Supporting Text + CTA Button */}
            <div className="lg:max-w-lg lg:border-l lg:border-sand lg:pl-12 xl:pl-16 space-y-6 sm:space-y-8">
              <p className="font-sans text-sm sm:text-base text-charcoal-muted leading-relaxed">
                WearOMNIA is built around modern modesty — bringing timeless character, thoughtful design, and everyday comfort together in pieces made to be lived in.
              </p>

              <div className="pt-1">
                <Link
                  href="/our-story"
                  className="group inline-flex items-center gap-2.5 bg-teal text-champagne px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-md border border-champagne/30 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Discover Our Story</span>
                  <ArrowRight className="w-4 h-4 text-champagne group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
