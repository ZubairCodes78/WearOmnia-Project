import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-offwhite">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="relative inline-block">
          <span className="font-serif text-8xl sm:text-9xl font-black text-sand-dark/60 select-none block tracking-tight">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-teal text-champagne flex items-center justify-center shadow-xl border border-champagne/40 card-3d">
              <Compass className="w-8 h-8 animate-spin-slow text-champagne" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
            Lost In The Wardrobe
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-teal tracking-tight uppercase">
            Well, This Is Awkward.
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed font-sans">
            The page you&apos;re looking for decided to skip class today. It might have been moved, renamed, or left for an emergency chai break.
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-teal text-champagne px-8 py-4 rounded-xl text-xs uppercase font-extrabold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl border border-champagne/30 btn-3d"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-sand/80 hover:bg-sand text-teal px-7 py-4 rounded-xl text-xs uppercase font-bold tracking-widest transition-all duration-300 border border-sand shadow-sm"
          >
            Explore Outfits <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-[11px] text-charcoal-muted/70 pt-4 font-sans tracking-wide">
          Modest clothes. Immodestly good outfit days.
        </p>
      </div>
    </div>
  );
}
