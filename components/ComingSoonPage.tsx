'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  WEAROMNIA_CAMPAIGN,
  calculateTimeRemaining,
  CountdownTimeRemaining,
  CampaignPhase,
} from '@/lib/preorder';
import { Copy, Check, ArrowRight } from 'lucide-react';

// ─── Real Social Media Links ─────────────────────────────────────────────────
const SOCIALS = [
  {
    name: 'INSTAGRAM',
    href: 'https://www.instagram.com/wearomnia_/',
    label: 'Follow WearOMNIA on Instagram',
    icon: (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
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
    icon: (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: 'TIKTOK',
    href: 'https://www.tiktok.com/@wearomnia_',
    label: 'Follow WearOMNIA on TikTok',
    icon: (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
      </svg>
    ),
  },
];

export const ComingSoonPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [couponRevealed, setCouponRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [phase, setPhase] = useState<CampaignPhase>('BEFORE_LAUNCH');
  const [timeRemaining, setTimeRemaining] = useState<CountdownTimeRemaining>({
    days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isZero: false,
  });

  // Dynamic campaign config from backend DB
  const [campaign, setCampaign] = useState<{
    code: string;
    discountValue: number;
    productionSiteUrl: string;
    startTimestampMs: number;
    endTimestampMs: number;
    startDateFormatted: string;
    timezone: string;
    isActive: boolean;
  }>({
    code: WEAROMNIA_CAMPAIGN.code,
    discountValue: WEAROMNIA_CAMPAIGN.discountAmount,
    productionSiteUrl: WEAROMNIA_CAMPAIGN.productionSiteUrl,
    startTimestampMs: WEAROMNIA_CAMPAIGN.startTimestampMs,
    endTimestampMs: WEAROMNIA_CAMPAIGN.endTimestampMs,
    startDateFormatted: '29 September 2026',
    timezone: 'Asia/Karachi',
    isActive: true,
  });

  const campaignRef = useRef(campaign);
  useEffect(() => { campaignRef.current = campaign; }, [campaign]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simulationStartRef = useRef<{ baseSec: number; startPerf: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    // QA simulation param
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const simSec = searchParams.get('simulate_seconds_before_launch');
      if (simSec) {
        const parsed = parseInt(simSec, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          simulationStartRef.current = { baseSec: parsed, startPerf: performance.now() };
        }
      }
    }

    // Fetch dynamic campaign config from backend
    fetch('/api/preorder/campaign', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.campaign) {
          setCampaign((prev) => ({ ...prev, ...data.campaign }));
        }
      })
      .catch(() => {});

    const updateCountdown = () => {
      let now = Date.now();
      const targetStart = campaignRef.current.startTimestampMs;

      if (simulationStartRef.current) {
        const elapsedSec = (performance.now() - simulationStartRef.current.startPerf) / 1000;
        const remainingSec = Math.max(0, simulationStartRef.current.baseSec - elapsedSec);
        now = targetStart - remainingSec * 1000;
      }

      if (now < targetStart && campaignRef.current.isActive) {
        setPhase('BEFORE_LAUNCH');
        setTimeRemaining(calculateTimeRemaining(targetStart, now));
      } else {
        setPhase('ACTIVE');
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isZero: true });
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(campaign.code);
      }
    } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShopNow = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.assign(campaign.productionSiteUrl);
  };

  const animStyle = (delayMs: number): React.CSSProperties => {
    if (!mounted) return { opacity: 0, transform: 'translate3d(0, 16px, 0)' };
    if (reducedMotion) return { opacity: 1, transform: 'none' };
    return {
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
    };
  };

  const isLive = phase === 'ACTIVE' || phase === 'ENDED' || timeRemaining.isZero;

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#103D42] overflow-x-hidden selection:bg-[#DFC3A0] selection:text-[#103D42] flex flex-col justify-between font-sans">

      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 w-[55vw] max-w-[650px] h-[55vw] max-h-[650px] rounded-full blur-[140px] opacity-30"
          style={{ background: 'radial-gradient(circle, #DFC3A0 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-32 w-[60vw] max-w-[700px] h-[60vw] max-h-[700px] rounded-full blur-[160px] opacity-15"
          style={{ background: 'radial-gradient(circle, #103D42 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={animStyle(0)}
        className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-6 sm:pt-10 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="WearOMNIA" width={240} height={70} priority className="h-10 sm:h-12 w-auto object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-2.5 text-[10px] uppercase tracking-[0.28em] text-[#103D42]/70 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFC3A0]" />
          <span>AUTUMN / WINTER 2026</span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#103D42]">LAHORE, PAKISTAN</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#DFC3A0] font-semibold block">EST. 2026</span>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="relative z-20 w-full max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 lg:py-16 flex-1 flex flex-col justify-center items-center text-center">

        {/* Headline */}
        <div
          style={animStyle(120)}
          className={`mb-4 sm:mb-6 max-w-3xl ${reducedMotion ? '' : 'transition-all duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)]'}`}
        >
          {!isLive ? (
            <h1 className="select-none tracking-tight leading-[1.05]">
              <span className="block text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#DFC3A0] mb-2">
                NEW COLLECTION
              </span>
              <span className="block font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#103D42]">
                PRE-ORDER STARTS <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#103D42]">
                  {campaign.startDateFormatted ? campaign.startDateFormatted.toUpperCase() : '29 SEPTEMBER'}
                </span>
              </span>
            </h1>
          ) : (
            <h1 className="select-none tracking-tight leading-[1.05]">
              <span className="block text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#DFC3A0] mb-2">
                NOW LIVE
              </span>
              <span className="block font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#103D42]">
                PRE-ORDER IS <span className="italic font-normal text-[#103D42]">NOW OPEN</span>
              </span>
            </h1>
          )}
        </div>

        {/* Countdown (Before Launch only, disappears at zero) */}
        {!isLive && (
          <section
            style={animStyle(200)}
            aria-live="polite"
            aria-label={`Pre-order starts in ${timeRemaining.days} days, ${timeRemaining.hours} hours, ${timeRemaining.minutes} minutes and ${timeRemaining.seconds} seconds`}
            className={`w-full max-w-xl my-6 sm:my-8 ${reducedMotion ? '' : 'transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]'}`}
          >
            <div className="space-y-3">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#103D42]/70 font-mono">
                STARTS IN
              </p>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md sm:max-w-lg mx-auto">
                {[
                  { value: timeRemaining.days, label: 'DAYS', fallback: '01' },
                  { value: timeRemaining.hours, label: 'HOURS', fallback: '02' },
                  { value: timeRemaining.minutes, label: 'MINUTES', fallback: '15' },
                  { value: timeRemaining.seconds, label: 'SECONDS', fallback: '44' },
                ].map((unit) => (
                  <div key={unit.label} className="bg-[#F4F0EA] border border-[#DFC3A0]/60 rounded-2xl p-2.5 sm:p-4 text-center shadow-xs flex flex-col justify-center aspect-[1/1] sm:aspect-auto">
                    <span className="font-mono text-xl sm:text-3xl md:text-4xl font-black text-[#103D42] tracking-tight">
                      {mounted ? pad(unit.value) : unit.fallback}
                    </span>
                    <span className="text-[8.5px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.16em] text-[#103D42]/60 mt-1">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#103D42]/50 font-mono tracking-wide pt-1">
                Pakistan Standard Time (Asia/Karachi)
              </p>
            </div>
          </section>
        )}

        {/* ── Coupon Card: Surprise Reveal ────────────────────────────────── */}
        <div style={animStyle(280)} className="w-full max-w-lg mb-8">
          <div className="relative rounded-2xl p-6 sm:p-7 bg-[#FAF8F5] border-2 border-[#DFC3A0] shadow-md">

            {/* Before reveal */}
            {!couponRevealed ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-sm sm:text-base font-serif italic text-[#103D42]/80">
                  There&apos;s a little something for you.
                </p>
                <button
                  type="button"
                  onClick={() => setCouponRevealed(true)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#103D42] text-[#DFC3A0] hover:bg-[#0C2E32] hover:text-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 cursor-pointer border border-[#DFC3A0]/30"
                >
                  SHOW COUPON
                </button>
              </div>
            ) : (
              /* After reveal — smooth slide in */
              <div
                className="space-y-4"
                style={{
                  animation: reducedMotion ? 'none' : 'couponReveal 0.5s ease-out forwards',
                }}
              >
                <style>{`
                  @keyframes couponReveal {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

                {/* Discount headline */}
                <div className="text-center space-y-1">
                  <p className="font-mono text-2xl sm:text-3xl font-extrabold text-[#103D42] tracking-wider">
                    {campaign.code}
                  </p>
                  <p className="text-lg sm:text-xl font-serif font-bold text-[#103D42]">
                    Rs. {campaign.discountValue.toLocaleString()} Off
                  </p>
                </div>

                {/* Copy Code button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#103D42] text-[#DFC3A0] hover:bg-[#0C2E32] hover:text-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 cursor-pointer border border-[#DFC3A0]/30"
                    aria-label={`Copy code ${campaign.code}`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Helper text */}
                <p className="text-xs text-[#103D42]/60 text-center">
                  Use this code at checkout.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Shop Now Button ─────────────────────────────────────────────── */}
        <div style={animStyle(360)} className="pt-2">
          <a
            href={campaign.productionSiteUrl}
            onClick={handleShopNow}
            className="group inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-[#103D42] text-[#DFC3A0] font-bold text-sm sm:text-base uppercase tracking-[0.22em] border border-[#DFC3A0]/40 shadow-xl hover:bg-[#0C2E32] hover:text-[#FAF8F5] hover:border-[#DFC3A0] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-w-[220px]"
            aria-label="Shop now on WearOMNIA"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-4 h-4 text-[#DFC3A0] group-hover:text-[#FAF8F5] group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        style={animStyle(440)}
        className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pb-8 sm:pb-10 pt-6 border-t border-[#DFC3A0]/30"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-[#103D42]/80 italic font-serif">
              Modest wardrobe essentials, thoughtfully designed.
            </p>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#103D42]/50 font-bold block mt-0.5">
              © 2026 WEAROMNIA. ALL RIGHTS RESERVED.
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6" role="list" aria-label="Social media">
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
