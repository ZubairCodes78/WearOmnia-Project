'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

interface AnnouncementTickerProps {
  initialAdvancePercent?: number;
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({
  initialAdvancePercent,
}) => {
  const { settings } = useSettings();

  const advancePercent =
    typeof settings.preorder_advance_percent === 'number' && settings.preorder_advance_percent > 0
      ? settings.preorder_advance_percent
      : (initialAdvancePercent || 50);

  const freeDeliveryLabel = settings.freeShippingThreshold
    ? `FREE DELIVERY (OVER RS. ${settings.freeShippingThreshold.toLocaleString()})`
    : 'FREE DELIVERY';

  // A single repeated message unit
  const renderMessageUnit = (keyPrefix: string) => (
    <div key={keyPrefix} className="inline-flex items-center gap-3 sm:gap-4 px-3 sm:px-4 shrink-0">
      <span className="font-bold text-[#D4AF37] tracking-[0.16em] sm:tracking-[0.2em]">
        PRE-ORDER STARTING
      </span>
      <span className="text-[#D4AF37]/40 text-[9px] select-none shrink-0">•</span>
      <span className="font-semibold text-[#FAF8F5] tracking-[0.16em] sm:tracking-[0.2em]">
        {freeDeliveryLabel}
      </span>
      <span className="text-[#D4AF37]/40 text-[9px] select-none shrink-0">•</span>
      <span className="font-bold text-[#D4AF37] tracking-[0.16em] sm:tracking-[0.2em]">
        {advancePercent}% ADVANCE PAYMENT TO CONFIRM YOUR ORDER
      </span>
      <span className="text-[#D4AF37]/40 text-[9px] select-none shrink-0">•</span>
    </div>
  );

  // Repeat 5 units per track block so even a 4K screen has zero empty space
  const trackUnits = ['u1', 'u2', 'u3', 'u4', 'u5'];

  return (
    <div
      role="region"
      aria-label="Store Announcement"
      className="w-full bg-[#06191B] text-[#D4AF37] border-b border-[#D4AF37]/20 select-none overflow-hidden h-8 sm:h-9 flex items-center relative z-40 text-[10px] sm:text-[11px] uppercase font-sans shadow-sm"
    >
      {/* ── Accessible Static View for Users with Prefers-Reduced-Motion ── */}
      <div className="hidden motion-reduce:flex items-center justify-center w-full px-4 text-center">
        <span className="inline-flex items-center gap-2 sm:gap-3 flex-wrap justify-center font-medium">
          <span className="font-bold text-[#D4AF37]">PRE-ORDER STARTING</span>
          <span className="text-[#D4AF37]/40 text-[9px]">•</span>
          <span className="font-semibold text-[#FAF8F5]">FREE DELIVERY</span>
          <span className="text-[#D4AF37]/40 text-[9px]">•</span>
          <span className="font-bold text-[#D4AF37]">
            {advancePercent}% ADVANCE PAYMENT TO CONFIRM YOUR ORDER
          </span>
        </span>
      </div>

      {/* ── Continuous Moving Ticker (Seamless Infinite Loop) ── */}
      <div
        className="flex shrink-0 items-center animate-ticker will-change-transform motion-reduce:hidden hover:[animation-play-state:paused] cursor-default"
      >
        {/* Track Half A */}
        <div className="flex shrink-0 items-center">
          {trackUnits.map((u) => renderMessageUnit(`a-${u}`))}
        </div>

        {/* Track Half B (Pixel-perfect twin for 100% seamless infinite loop with zero jump) */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {trackUnits.map((u) => renderMessageUnit(`b-${u}`))}
        </div>
      </div>
    </div>
  );
};
