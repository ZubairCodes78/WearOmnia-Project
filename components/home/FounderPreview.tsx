import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Instagram } from 'lucide-react';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

export const FounderPreview: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#041517] text-offwhite border-t border-champagne/20 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Founder Portrait */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal variant="fade-up" className="w-full max-w-sm sm:max-w-md">
              <div className="relative aspect-[1181/1332] rounded-3xl overflow-hidden border border-champagne/30 shadow-2xl shadow-black/40 group">
                <Image
                  src="/images/founder.png"
                  alt="Virago Baji, Founder of WearOMNIA"
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  quality={90}
                  loading="lazy"
                  className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041517]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-champagne block">
                    Leadership
                  </span>
                  <span className="font-serif text-lg font-bold text-offwhite block">
                    Virago Baji
                  </span>
                  <span className="text-xs text-offwhite/70 font-sans">
                    Founder, WearOMNIA
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Vision Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <ScrollReveal variant="fade-up" delay={0.1}>
              <span className="font-calligraphy text-xs sm:text-sm text-champagne block tracking-[0.25em]">
                THE VISION BEHIND WEAROMNIA
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-offwhite mt-2 leading-tight tracking-tight">
                Modesty, Designed With Quiet Confidence.
              </h2>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={0.2} className="space-y-4 text-xs sm:text-sm text-offwhite/80 leading-relaxed font-sans max-w-xl mx-auto lg:mx-0">
              <p>
                WearOMNIA began with a simple conviction — that modest fashion should never feel like an afterthought, and personal style should never demand a compromise on your values.
              </p>
              <p>
                Founded by <strong className="text-champagne font-semibold">Virago Baji</strong>, WearOMNIA creates refined, ready-to-wear pieces tailored for university mornings, workdays, and family evenings where you want generous coverage without sacrificing modern tailoring.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={0.3} className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/founder"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-champagne text-teal-950 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg hover:shadow-champagne/20 group"
              >
                <span>Meet The Founder</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="https://www.instagram.com/life_on_camerae/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-950/80 text-champagne border border-champagne/40 font-sans font-semibold text-xs tracking-wider hover:bg-champagne/10 hover:border-champagne transition-all"
                aria-label="Follow Virago Baji on Instagram (opens in new tab)"
              >
                <Instagram className="w-4 h-4 text-champagne" />
                <span>@life_on_camerae</span>
              </a>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
