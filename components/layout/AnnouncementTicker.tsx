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

  // If announcement header is disabled in Admin Panel, completely hide
  if (settings.announcementEnabled === false) {
    return null;
  }

  // Pre-Order Campaign & System Status
  const isPreOrderEnabled = Boolean(settings.preorder_enabled);
  const isCampaignActive =
    settings.is_preorder_campaign_active !== undefined
      ? settings.is_preorder_campaign_active
      : true;

  // Pre-Order announcement is active ONLY when enabled AND campaign is active / not expired
  const showPreOrder = isPreOrderEnabled && isCampaignActive;

  // Advance Payment Status & Percentage
  const advancePercent =
    typeof settings.preorder_advance_percent === 'number' && settings.preorder_advance_percent > 0
      ? settings.preorder_advance_percent
      : (initialAdvancePercent || 50);

  const isAdvanceEnabled =
    settings.preorder_advance_enabled !== false &&
    advancePercent > 0 &&
    (settings.has_active_payment_methods !== undefined ? settings.has_active_payment_methods : true);

  // Advance payment message is shown ONLY if Pre-Order is active AND advance payment is required
  const showAdvancePayment = showPreOrder && isAdvanceEnabled;

  // Build synchronized announcement message items
  interface MessageItem {
    text: string;
    highlight: boolean;
  }

  const items: MessageItem[] = [];

  // 1. Pre-Order Announcement
  if (showPreOrder) {
    const isBeforeLaunch = settings.preorder_campaign_phase === 'BEFORE_LAUNCH';
    items.push({
      text: isBeforeLaunch ? 'PRE-ORDER STARTING' : 'PRE-ORDER IS NOW LIVE',
      highlight: true,
    });
  }

  // 2. Advance Payment Announcement (always shows actual admin-configured percentage)
  if (showAdvancePayment) {
    items.push({
      text: `${advancePercent}% ADVANCE PAYMENT REQUIRED`,
      highlight: true,
    });
  }

  // 3. Free Delivery Announcement (reflects configured free shipping threshold)
  const freeDeliveryLabel =
    settings.freeShippingThreshold && settings.freeShippingThreshold > 0
      ? `FREE DELIVERY (OVER RS. ${settings.freeShippingThreshold.toLocaleString()})`
      : 'FREE DELIVERY';

  items.push({
    text: freeDeliveryLabel,
    highlight: false,
  });

  // 4. Configured Store Announcement from Admin Panel (sanitized to prevent contradictory messages)
  if (settings.announcementText && typeof settings.announcementText === 'string') {
    const rawParts = settings.announcementText
      .split(/[•|]/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const part of rawParts) {
      const upper = part.toUpperCase();
      // Drop any pre-order text if pre-order is disabled or campaign expired
      const mentionsPreOrder = /PRE-?ORDER|ADVANCE PAYMENT|RESERVATION/i.test(part);
      if (!showPreOrder && mentionsPreOrder) {
        continue;
      }
      // Avoid duplicate free-delivery phrases or already included items
      const isDuplicate =
        items.some((it) => it.text.toUpperCase() === upper) ||
        upper.includes('FREE DELIVERY');
      if (!isDuplicate) {
        items.push({ text: upper, highlight: false });
      }
    }
  }

  if (items.length === 0) {
    return null;
  }

  // A single repeated message unit containing all synchronized announcement segments
  const renderMessageUnit = (keyPrefix: string) => (
    <div key={keyPrefix} className="inline-flex items-center gap-3 sm:gap-4 px-3 sm:px-4 shrink-0">
      {items.map((item, idx) => (
        <React.Fragment key={`${keyPrefix}-${idx}`}>
          <span
            className={
              item.highlight
                ? 'font-bold text-[#D4AF37] tracking-[0.16em] sm:tracking-[0.2em]'
                : 'font-semibold text-[#FAF8F5] tracking-[0.16em] sm:tracking-[0.2em]'
            }
          >
            {item.text}
          </span>
          <span className="text-[#D4AF37]/40 text-[9px] select-none shrink-0">•</span>
        </React.Fragment>
      ))}
    </div>
  );

  // Repeat enough units so even ultra-wide 4K screens have zero gap
  const unitCount = items.length <= 1 ? 8 : 5;
  const trackUnits = Array.from({ length: unitCount }, (_, i) => `u${i + 1}`);

  return (
    <div
      role="region"
      aria-label="Store Announcement"
      className="w-full bg-[#06191B] text-[#D4AF37] border-b border-[#D4AF37]/20 select-none overflow-hidden h-8 sm:h-9 flex items-center relative z-40 text-[10px] sm:text-[11px] uppercase font-sans shadow-sm"
    >
      {/* ── Accessible Static View for Users with Prefers-Reduced-Motion ── */}
      <div className="hidden motion-reduce:flex items-center justify-center w-full px-4 text-center">
        <span className="inline-flex items-center gap-2 sm:gap-3 flex-wrap justify-center font-medium">
          {items.map((item, idx) => (
            <React.Fragment key={`static-${idx}`}>
              <span className={item.highlight ? 'font-bold text-[#D4AF37]' : 'font-semibold text-[#FAF8F5]'}>
                {item.text}
              </span>
              {idx < items.length - 1 && (
                <span className="text-[#D4AF37]/40 text-[9px] select-none shrink-0">•</span>
              )}
            </React.Fragment>
          ))}
        </span>
      </div>

      {/* ── Continuous Moving Ticker (Seamless Infinite Loop on Desktop, Tablet & Mobile) ── */}
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
