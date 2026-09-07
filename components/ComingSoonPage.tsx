'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// ─── Real social links (preserved exactly from site Footer) ──────────────────
const SOCIALS = [
  {
    name: 'INSTAGRAM',
    href: 'https://www.instagram.com/wearomnia_/',
    label: 'Follow WearOMNIA on Instagram',
    handle: '@wearomnia_',
    icon: (
      <svg
        className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'FACEBOOK',
    href: 'https://www.facebook.com/profile.php?id=61579169068040',
    label: 'Follow WearOMNIA on Facebook',
    handle: 'WearOMNIA',
    icon: (
      <svg
        className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: 'TIKTOK',
    href: 'https://www.tiktok.com/@wearomnia_',
    label: 'Follow WearOMNIA on TikTok',
    handle: '@wearomnia_',
    icon: (
      <svg
        className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
      </svg>
    ),
  },
];

export const ComingSoonPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  // Staggered smooth entry animation helper
  const animStyle = (delayMs: number) => {
    if (!mounted) {
      return {
        opacity: 0,
        transform: 'translate3d(0, 20px, 0)',
      };
    }
    if (reducedMotion) {
      return {
        opacity: 1,
        transform: 'none',
      };
    }
    return {
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
      transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
    };
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#103D42] overflow-x-hidden selection:bg-[#DFC3A0] selection:text-[#103D42] flex flex-col justify-between">
      
      {/* ── 1. SUBTLE ATMOSPHERIC GRADIENT CANVAS (NO IMAGES / NO 3D) ──────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft Champagne Atmospheric Light */}
        <div
          className="absolute -top-32 -right-32 w-[55vw] max-w-[700px] h-[55vw] max-h-[700px] rounded-full blur-[140px] opacity-35"
          style={{ background: 'radial-gradient(circle, #DFC3A0 0%, transparent 70%)' }}
        />

        {/* Faint Sand Grounding Gradient */}
        <div
          className="absolute -bottom-40 -left-32 w-[60vw] max-w-[750px] h-[60vw] max-h-[750px] rounded-full blur-[160px] opacity-15"
          style={{ background: 'radial-gradient(circle, #103D42 0%, transparent 70%)' }}
        />

        {/* Tactile Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ── 2. TOP EDITORIAL HEADER WITH ORIGINAL LOGO ──────────────────────── */}
      <header
        style={animStyle(0)}
        className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 flex items-center justify-between"
      >
        {/* Left: Original WearOMNIA Logo PNG */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="WearOMNIA Logo"
            width={240}
            height={70}
            priority
            className="h-10 sm:h-14 w-auto object-contain"
          />
        </div>

        {/* Center Campaign Tag (Desktop) */}
        <div className="hidden md:flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-[#103D42]/70 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFC3A0] animate-pulse" />
          <span>MODEST FASHION</span>
          <span className="text-[#DFC3A0]">/</span>
          <span>LAUNCH EDITION 001</span>
        </div>

        {/* Right Location Tag */}
        <div className="text-right">
          <span
            className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-[#103D42]/80"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            LAHORE, PAKISTAN
          </span>
          <span className="hidden sm:block text-[9px] uppercase tracking-[0.22em] text-[#DFC3A0]">
            EST. 2026
          </span>
        </div>
      </header>

      {/* ── 3. MAIN HERO SECTION (TYPOGRAPHY & LAUNCH PERSONALITY FOCUS) ────── */}
      <main className="relative z-20 w-full max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-24 flex-1 flex flex-col justify-center items-start text-left">

        {/* Campaign Edition Label */}
        <div style={animStyle(120)} className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#DFC3A0]/70 bg-[#F4F0EA]/80 backdrop-blur-sm shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#103D42]" />
            <span
              className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#103D42]"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              WEAROMNIA / 001
            </span>
          </div>
        </div>

        {/* Main High-Fashion Headline */}
        <div style={animStyle(240)} className="mb-6 sm:mb-8">
          <h1 className="select-none tracking-tight leading-[0.92]">
            <span
              className="block font-black text-[#103D42] uppercase"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: 'clamp(3.5rem, 10vw, 7.5rem)',
                letterSpacing: '-0.03em',
              }}
            >
              COMING
            </span>
            <span
              className="block font-normal text-[#103D42] italic font-serif"
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 'clamp(4.2rem, 11.5vw, 8.8rem)',
                lineHeight: '0.88',
                marginLeft: '0.04em',
              }}
            >
              SOON.
            </span>
          </h1>
        </div>

        {/* Main Slogan Line */}
        <div style={animStyle(360)} className="mb-5 sm:mb-6 max-w-2xl">
          <p
            className="text-[#103D42] leading-tight"
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
              fontStyle: 'italic',
            }}
          >
            &ldquo;Your &apos;I have nothing to wear&apos; era is almost over.&rdquo;
          </p>
        </div>

        {/* Supporting Line */}
        <div style={animStyle(450)} className="mb-8 sm:mb-10 max-w-xl">
          <p
            className="text-[#103D42]/75 text-sm sm:text-base font-normal leading-relaxed"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Something beautiful is being prepared. Thoughtfully designed modest wardrobe essentials for university days, chai runs, and moments that matter.
          </p>
        </div>

        {/* Subtle Pakistani University-Girl Relatable Humor Line */}
        <div style={animStyle(540)} className="mb-10 sm:mb-12 max-w-md w-full">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#DFC3A0]/60 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DFC3A0]" />
            <div className="flex items-start gap-3 pl-1">
              <div className="text-[#DFC3A0] pt-0.5 shrink-0">
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <div>
                <p
                  className="text-[#103D42] text-xs sm:text-sm font-medium leading-relaxed"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  &ldquo;8AM class. Still worth dressing up for.&rdquo;
                </p>
                <span
                  className="block mt-1 text-[10px] uppercase tracking-[0.2em] text-[#103D42]/60 font-semibold"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  — WearOMNIA Pre-Launch Edition
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Launch CTA (Social Connection Only — NO Shopping / Storefront CTAs) */}
        <div style={animStyle(640)}>
          <a
            href="https://www.instagram.com/wearomnia_/"
            target="_blank"
            rel="noopener noreferrer"
            className="
              group relative inline-flex items-center gap-4 px-8 py-4 sm:px-10 sm:py-4.5 rounded-xl
              bg-[#103D42] text-[#DFC3A0] font-bold text-xs sm:text-sm uppercase tracking-[0.22em]
              border border-[#DFC3A0]/40 shadow-xl hover:shadow-2xl
              hover:bg-[#0C2E32] hover:text-[#FAF8F5] hover:border-[#DFC3A0]
              transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0
            "
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <span>FOLLOW THE LAUNCH</span>
            <svg
              className="w-4 h-4 text-[#DFC3A0] group-hover:text-[#FAF8F5] group-hover:translate-x-1.5 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </a>
        </div>

      </main>

      {/* ── 4. FOOTER & SOCIAL LINKS (PRESERVED REAL DEPOSITORIES) ──────────── */}
      <footer
        style={animStyle(750)}
        className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-8 sm:pb-10 pt-6 border-t border-[#DFC3A0]/30"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Micro Humour / Copyright */}
          <div className="text-center sm:text-left">
            <p
              className="text-xs sm:text-sm text-[#103D42]/80 italic"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              Your current wardrobe has been warned.
            </p>
            <span
              className="text-[9px] uppercase tracking-[0.22em] text-[#103D42]/50 font-semibold block mt-0.5"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              © 2026 WEAROMNIA. ALL RIGHTS RESERVED.
            </span>
          </div>

          {/* Social Media Links Row */}
          <div className="flex items-center gap-4 sm:gap-6" role="list" aria-label="Social media channels">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                role="listitem"
                className="group flex items-center gap-2 py-1.5 px-3 rounded-lg border border-[#DFC3A0]/30 bg-[#F4F0EA]/60 hover:bg-[#103D42] hover:border-[#103D42] transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="text-[#103D42] group-hover:text-[#DFC3A0] transition-colors duration-300">
                  {social.icon}
                </span>
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-[#103D42] group-hover:text-[#FAF8F5] transition-colors duration-300"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {social.name}
                </span>
              </a>
            ))}
          </div>

        </div>
      </footer>
    </div>
  );
};
