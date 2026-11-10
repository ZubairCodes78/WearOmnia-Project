'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CampaignCountdownProps {
  targetDateIso: string;
  serverTimeMs?: number;
  label?: string;
  variant?: 'banner' | 'compact' | 'light';
  onExpire?: () => void;
}

interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeRemaining(targetMs: number, offsetMs: number): RemainingTime {
  const nowAdjusted = Date.now() + offsetMs;
  const diff = targetMs - nowAdjusted;

  if (diff <= 0 || isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: false };
}

export const CampaignCountdown: React.FC<CampaignCountdownProps> = ({
  targetDateIso,
  serverTimeMs,
  label = 'Ends in',
  variant = 'banner',
  onExpire,
}) => {
  const targetMs = new Date(targetDateIso).getTime();
  // Capture server-to-client clock offset once on mount so local system clock drift doesn't skew timer
  const offsetRef = useRef<number>(
    typeof serverTimeMs === 'number' ? serverTimeMs - Date.now() : 0
  );
  const firedExpireRef = useRef(false);

  const [remaining, setRemaining] = useState<RemainingTime>(() =>
    computeRemaining(targetMs, offsetRef.current)
  );

  useEffect(() => {
    firedExpireRef.current = false;
    setRemaining(computeRemaining(targetMs, offsetRef.current));

    const timer = setInterval(() => {
      const next = computeRemaining(targetMs, offsetRef.current);
      setRemaining(next);
      if (next.expired) {
        clearInterval(timer);
        if (!firedExpireRef.current) {
          firedExpireRef.current = true;
          onExpire?.();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetMs, onExpire]);

  if (isNaN(targetMs) || remaining.expired) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#D4AF37] bg-[#06191B] px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
        <Clock className="w-3 h-3" />
        <span>
          {label}:{' '}
          {remaining.days > 0 ? `${remaining.days}d ` : ''}
          {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
        </span>
      </span>
    );
  }

  if (variant === 'light') {
    return (
      <div className="inline-flex items-center gap-2 bg-sand/70 border border-champagne/40 rounded-xl px-3 py-1.5 text-teal text-xs font-mono font-bold">
        <Clock className="w-3.5 h-3.5 text-champagne-700" />
        <span className="uppercase font-sans text-[10px] tracking-wider text-charcoal-muted">
          {label}
        </span>
        <span>
          {remaining.days > 0 ? `${remaining.days}d ` : ''}
          {pad(remaining.hours)}h : {pad(remaining.minutes)}m : {pad(remaining.seconds)}s
        </span>
      </div>
    );
  }

  const segments = [
    ...(remaining.days > 0 ? [{ v: pad(remaining.days), l: 'Days' }] : []),
    { v: pad(remaining.hours), l: 'Hrs' },
    { v: pad(remaining.minutes), l: 'Min' },
    { v: pad(remaining.seconds), l: 'Sec' },
  ];

  return (
    <div className="inline-flex items-center gap-2.5 flex-wrap" aria-label={`${label} countdown`}>
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-champagne/90 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {segments.map((seg) => (
          <div
            key={seg.l}
            className="min-w-[44px] px-2 py-1.5 rounded-lg bg-[#06191B]/85 border border-champagne/35 text-center shadow-sm backdrop-blur-xs"
          >
            <span className="font-mono font-black text-sm sm:text-base text-offwhite block leading-none">
              {seg.v}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-champagne/80 block mt-0.5">
              {seg.l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

