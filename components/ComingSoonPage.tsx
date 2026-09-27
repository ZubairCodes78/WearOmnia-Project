'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  WEAROMNIA_CAMPAIGN,
  getCampaignPhase,
  calculateTimeRemaining,
  CountdownTimeRemaining,
  CampaignPhase,
} from '@/lib/preorder';
import { Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

// ─── Real Social Media Links Preserved From WearOMNIA Depot ──────────────────
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
  const [copied, setCopied] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Real-time countdown & campaign phase state
  const [phase, setPhase] = useState<CampaignPhase>('BEFORE_LAUNCH');
  const [timeRemaining, setTimeRemaining] = useState<CountdownTimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    isZero: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    // Initial calculation based on authoritative Asia/Karachi target timestamp
    const updateCountdown = () => {
      const now = Date.now();
      const currentPhase = getCampaignPhase(now);
      setPhase(currentPhase);

      if (currentPhase === 'BEFORE_LAUNCH') {
        const remaining = calculateTimeRemaining(WEAROMNIA_CAMPAIGN.startTimestampMs, now);
        setTimeRemaining(remaining);
      } else if (currentPhase === 'ACTIVE') {
        const remaining = calculateTimeRemaining(WEAROMNIA_CAMPAIGN.endTimestampMs, now);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalMs: 0,
          isZero: true,
        });
      }
    };

    updateCountdown();

    // 1-second interval for real-time countdown without memory leak
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format digit with leading zero
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Copy code handler — Strictly copies code, NO auto-apply, NO cart modification
  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(WEAROMNIA_CAMPAIGN.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Staggered entry animation style
  const animStyle = (delayMs: number): React.CSSProperties => {
    if (!mounted) {
      return {
        opacity: 0,
        transform: 'translate3d(0, 16px, 0)',
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
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
    };
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#103D42] overflow-x-hidden selection:bg-[#DFC3A0] selection:text-[#103D42] flex flex-col justify-between font-sans">
      
      {/* ── 1. SUBTLE LUXURY BACKGROUND AMBIENCE ──────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft Champagne Atmospheric Glow */}
        <div
          className="absolute -top-32 -right-32 w-[55vw] max-w-[650px] h-[55vw] max-h-[650px] rounded-full blur-[140px] opacity-30"
          style={{ background: 'radial-gradient(circle, #DFC3A0 0%, transparent 70%)' }}
        />

        {/* Deep Emerald Grounding Light */}
        <div
          className="absolute -bottom-40 -left-32 w-[60vw] max-w-[700px] h-[60vw] max-h-[700px] rounded-full blur-[160px] opacity-15"
          style={{ background: 'radial-gradient(circle, #103D42 0%, transparent 70%)' }}
        />

        {/* Tactile Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ── 2. HEADER WITH ORIGINAL LOGO ──────────────────────────────────── */}
      <header
        style={animStyle(0)}
        className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-6 sm:pt-10 flex items-center justify-between"
      >
        {/* Left: Original WearOMNIA Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="WearOMNIA Logo"
            width={240}
            height={70}
            priority
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>

        {/* Center Tagline (Desktop) */}
        <div className="hidden md:flex items-center gap-2.5 text-[10px] uppercase tracking-[0.28em] text-[#103D42]/70 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFC3A0]" />
          <span>AUTUMN / WINTER 2026</span>
          <span className="text-[#DFC3A0]">•</span>
          <span>LAUNCH EDITION 001</span>
        </div>

        {/* Right Location */}
        <div className="text-right">
          <span className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#103D42]">
            LAHORE, PAKISTAN
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#DFC3A0] font-semibold block">
            EST. 2026
          </span>
        </div>
      </header>

      {/* ── 3. MAIN HERO CONTENT AREA ─────────────────────────────────────── */}
      <main className="relative z-20 w-full max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 lg:py-16 flex-1 flex flex-col justify-center items-center text-center">

        {/* Brand Eyebrow Tag */}
        <div style={animStyle(80)} className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#DFC3A0]/70 bg-[#F4F0EA]/80 backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3 h-3 text-[#103D42]" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] text-[#103D42]">
              WEAROMNIA ATELIER
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div style={animStyle(160)} className="mb-4 sm:mb-6 max-w-3xl">
          {phase === 'BEFORE_LAUNCH' ? (
            <h1 className="select-none tracking-tight leading-[1.05]">
              <span className="block text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#DFC3A0] mb-2">
                EXCLUSIVE COLLECTION
              </span>
              <span className="block font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#103D42]">
                PRE-ORDER STARTS <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#103D42]">29 SEPTEMBER</span>
              </span>
            </h1>
          ) : phase === 'ACTIVE' ? (
            <h1 className="select-none tracking-tight leading-[1.05]">
              <span className="block text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#DFC3A0] mb-2">
                COLLECTION IS LIVE
              </span>
              <span className="block font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#103D42]">
                PRE-ORDER IS <span className="italic font-normal text-[#103D42]">NOW OPEN</span>
              </span>
            </h1>
          ) : (
            <h1 className="select-none tracking-tight leading-[1.05]">
              <span className="block font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#103D42]">
                PRE-ORDER CAMPAIGN <span className="italic font-normal text-[#103D42]">CONCLUDED</span>
              </span>
            </h1>
          )}
        </div>

        {/* ── 4. REAL-TIME COUNTDOWN TIMER (Requirements 4, 5, 6, 7, 11, 12, 17) ── */}
        <section
          style={animStyle(240)}
          aria-live="polite"
          aria-label={
            phase === 'BEFORE_LAUNCH'
              ? `Pre-order starts in ${timeRemaining.days} days, ${timeRemaining.hours} hours, ${timeRemaining.minutes} minutes and ${timeRemaining.seconds} seconds`
              : 'Pre-order is now open'
          }
          className="w-full max-w-xl my-6 sm:my-8"
        >
          {phase === 'BEFORE_LAUNCH' && (
            <div className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#103D42]/70 font-mono">
                PRE-ORDER STARTS IN
              </p>

              {/* Responsive 4-Column Countdown Grid (No Horizontal Overflow) */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md sm:max-w-lg mx-auto">
                {/* DAYS */}
                <div className="bg-[#F4F0EA] border border-[#DFC3A0]/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-xs flex flex-col justify-center aspect-[1/1] sm:aspect-auto">
                  <span className="font-mono text-xl sm:text-3xl md:text-4xl font-black text-[#103D42] tracking-tight">
                    {mounted ? pad(timeRemaining.days) : '01'}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.16em] text-[#103D42]/60 mt-1">
                    DAYS
                  </span>
                </div>

                {/* HOURS */}
                <div className="bg-[#F4F0EA] border border-[#DFC3A0]/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-xs flex flex-col justify-center aspect-[1/1] sm:aspect-auto">
                  <span className="font-mono text-xl sm:text-3xl md:text-4xl font-black text-[#103D42] tracking-tight">
                    {mounted ? pad(timeRemaining.hours) : '02'}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.16em] text-[#103D42]/60 mt-1">
                    HOURS
                  </span>
                </div>

                {/* MINUTES */}
                <div className="bg-[#F4F0EA] border border-[#DFC3A0]/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-xs flex flex-col justify-center aspect-[1/1] sm:aspect-auto">
                  <span className="font-mono text-xl sm:text-3xl md:text-4xl font-black text-[#103D42] tracking-tight">
                    {mounted ? pad(timeRemaining.minutes) : '15'}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.16em] text-[#103D42]/60 mt-1">
                    MINUTES
                  </span>
                </div>

                {/* SECONDS */}
                <div className="bg-[#F4F0EA] border border-[#DFC3A0]/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-xs flex flex-col justify-center aspect-[1/1] sm:aspect-auto">
                  <span className="font-mono text-xl sm:text-3xl md:text-4xl font-black text-[#103D42] tracking-tight">
                    {mounted ? pad(timeRemaining.seconds) : '44'}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.16em] text-[#103D42]/60 mt-1">
                    SECONDS
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-[#103D42]/50 font-mono tracking-wide pt-1">
                Official Countdown • Asia/Karachi (Pakistan Standard Time)
              </p>
            </div>
          )}

          {phase === 'ACTIVE' && (
            <div className="space-y-4 bg-[#F4F0EA] border border-[#DFC3A0]/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#103D42] text-[#DFC3A0] text-xs font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Pre-Order Bookings Active
              </div>
              <p className="text-xs sm:text-sm text-[#103D42] font-serif italic max-w-md mx-auto">
                Secure your handcrafted velvet and pure silk silhouettes with 50% advance booking.
              </p>
              <div className="text-[10.5px] font-mono font-bold tracking-widest text-[#103D42]/60 uppercase">
                PRE-ORDER ENDS 20 OCTOBER 2026
              </div>
            </div>
          )}

          {phase === 'ENDED' && (
            <div className="bg-[#F4F0EA] border border-[#DFC3A0]/60 rounded-2xl p-6 shadow-sm space-y-2">
              <p className="text-sm font-serif text-[#103D42] italic">
                Thank you for being part of our Autumn/Winter 2026 pre-order edition. Dispatch and deliveries are underway.
              </p>
            </div>
          )}
        </section>

        {/* ── 5. EXCLUSIVE PRE-ORDER OFFER & COUPON CARD (Requirements 1, 2, 16, 19, 20, 21) ── */}
        <div style={animStyle(320)} className="w-full max-w-lg mb-8">
          <div className="relative rounded-2xl p-6 sm:p-7 bg-[#FAF8F5] border-2 border-[#DFC3A0] shadow-md space-y-4">
            {/* Offer Eyebrow */}
            <div className="space-y-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#DFC3A0] block font-mono">
                EXCLUSIVE PRE-ORDER OFFER
              </span>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#103D42]">
                PKR 500 OFF
              </p>
            </div>

            {/* Voucher Box & Copy Code Interaction */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-2 bg-[#F4F0EA] border border-[#DFC3A0]/80 rounded-xl px-4 py-2.5 w-full sm:w-auto justify-center">
                <span className="text-[10px] uppercase font-bold text-[#103D42]/60 tracking-wider">
                  USE CODE:
                </span>
                <span className="font-mono text-base font-extrabold text-[#103D42] tracking-wider selection:bg-[#103D42] selection:text-[#DFC3A0]">
                  {WEAROMNIA_CAMPAIGN.code}
                </span>
              </div>

              {/* Copy Code Button — Strictly Copies, Never Auto-Applies */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#103D42] text-[#DFC3A0] hover:bg-[#0C2E32] hover:text-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 cursor-pointer border border-[#DFC3A0]/30"
                aria-label={`Copy discount code ${WEAROMNIA_CAMPAIGN.code}`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY CODE</span>
                  </>
                )}
              </button>
            </div>

            {/* Supporting Caption */}
            <p className="text-xs text-[#103D42]/70 font-sans max-w-sm mx-auto leading-relaxed pt-1">
              Enter this code at checkout to get PKR 500 off your pre-order.
            </p>

            <div className="pt-2 border-t border-[#DFC3A0]/30 flex items-center justify-center gap-2 text-[10.5px] text-[#103D42]/60">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DFC3A0]" />
              <span>Valid for Pre-Order bookings • 50% Advance with proof verification</span>
            </div>
          </div>
        </div>

        {/* ── 6. PRIMARY LAUNCH / STOREFRONT CTA (Requirements 8, 14, 28) ────── */}
        <div style={animStyle(400)} className="pt-2">
          {phase === 'ACTIVE' ? (
            <Link
              href="/shop"
              className="group relative inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-4.5 rounded-xl bg-[#103D42] text-[#DFC3A0] font-bold text-xs sm:text-sm uppercase tracking-[0.22em] border border-[#DFC3A0]/40 shadow-xl hover:bg-[#0C2E32] hover:text-[#FAF8F5] hover:border-[#DFC3A0] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>SHOP PRE-ORDER</span>
              <ArrowRight className="w-4 h-4 text-[#DFC3A0] group-hover:text-[#FAF8F5] group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          ) : (
            <a
              href="https://www.instagram.com/wearomnia_/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-4.5 rounded-xl bg-[#103D42] text-[#DFC3A0] font-bold text-xs sm:text-sm uppercase tracking-[0.22em] border border-[#DFC3A0]/40 shadow-xl hover:bg-[#0C2E32] hover:text-[#FAF8F5] hover:border-[#DFC3A0] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>FOLLOW THE LAUNCH</span>
              <ArrowRight className="w-4 h-4 text-[#DFC3A0] group-hover:text-[#FAF8F5] group-hover:translate-x-1.5 transition-transform duration-300" />
            </a>
          )}
        </div>

      </main>

      {/* ── 7. FOOTER WITH SOCIAL LINKS & COPYRIGHT ───────────────────────── */}
      <footer
        style={animStyle(480)}
        className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-8 sm:pb-10 pt-6 border-t border-[#DFC3A0]/30"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Micro Slogan / Copyright */}
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-[#103D42]/80 italic font-serif">
              Thoughtfully designed modest wardrobe essentials.
            </p>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#103D42]/50 font-bold block mt-0.5">
              © 2026 WEAROMNIA. ALL RIGHTS RESERVED.
            </span>
          </div>

          {/* Social Links Row */}
          <div className="flex items-center gap-4 sm:gap-6" role="list" aria-label="Social media channels">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                role="listitem"
                className="group flex items-center gap-2 py-1.5 px-3 rounded-lg border border-[#DFC3A0]/30 bg-[#F4F0EA]/60 hover:bg-[#103D42] hover:border-[#103D42] transition-all duration-300 shadow-xs hover:shadow-sm"
              >
                <span className="text-[#103D42] group-hover:text-[#DFC3A0] transition-colors duration-300">
                  {social.icon}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-[#103D42] group-hover:text-[#FAF8F5] transition-colors duration-300">
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
