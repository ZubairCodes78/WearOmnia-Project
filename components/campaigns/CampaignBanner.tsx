'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import type { PublicCampaignSummary } from '@/lib/campaign-math';
import { CampaignCountdown } from '@/components/campaigns/CampaignCountdown';

interface CampaignBannerProps {
  campaign: PublicCampaignSummary;
  serverTimeMs?: number;
  isHeroMode?: boolean;
  hideCta?: boolean;
}

export const CampaignBanner: React.FC<CampaignBannerProps> = ({
  campaign,
  serverTimeMs,
  isHeroMode = false,
  hideCta = false,
}) => {
  const router = useRouter();

  const ctaHref = campaign.ctaLink || `/sale/${campaign.slug}`;
  const headline = campaign.bannerTitle || campaign.publicTitle;
  const subtitle = campaign.bannerSubtitle || campaign.landingPageDescription;
  const endDateIso = campaign.endDate ? new Date(campaign.endDate).toISOString() : null;
  const hasDesktopImg = Boolean(campaign.desktopBannerUrl);
  const hasMobileImg = Boolean(campaign.mobileBannerUrl || campaign.desktopBannerUrl);

  const discountLabel =
    campaign.discountType === 'PERCENTAGE'
      ? `UP TO ${campaign.discountValue}% OFF`
      : `FLAT RS. ${campaign.discountValue.toLocaleString()} OFF`;

  return (
    <section
      aria-label={campaign.publicTitle}
      className={
        isHeroMode
          ? 'relative w-full bg-[#06191B] overflow-hidden border-b border-champagne/25'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
      }
    >
      <div
        className={`relative overflow-hidden bg-[#06191B] text-offwhite ${
          isHeroMode
            ? 'w-full min-h-[380px] sm:min-h-[460px] lg:min-h-[540px] flex items-center'
            : 'rounded-2xl sm:rounded-3xl border border-champagne/30 shadow-xl'
        }`}
      >
        {/* Optional Admin-Uploaded R2 Responsive Banner Artwork */}
        {hasDesktopImg && (
          <div className="hidden sm:block absolute inset-0">
            <Image
              src={campaign.desktopBannerUrl!}
              alt={headline}
              fill
              priority={isHeroMode}
              sizes="100vw"
              quality={85}
              className="object-cover object-center opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06191B] via-[#06191B]/85 to-[#06191B]/30" />
          </div>
        )}

        {hasMobileImg && (
          <div className="sm:hidden absolute inset-0">
            <Image
              src={campaign.mobileBannerUrl || campaign.desktopBannerUrl!}
              alt={headline}
              fill
              priority={isHeroMode}
              sizes="100vw"
              quality={85}
              className="object-cover object-center opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06191B] via-[#06191B]/85 to-[#06191B]/60" />
          </div>
        )}

        {/* Content Overlay / Pure Editorial Canvas */}
        <div
          className={`relative z-10 w-full ${
            isHeroMode
              ? 'max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16'
              : 'px-6 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-12'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-7">
            <div className="max-w-2xl space-y-3.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-champagne/15 border border-champagne/45 text-champagne text-[10px] font-black uppercase tracking-[0.22em]">
                  {campaign.badgeText || 'SEASONAL EDIT'}
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-offwhite/85">
                  {discountLabel}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-offwhite tracking-tight leading-[1.08]">
                {headline}
              </h2>

              {subtitle && (
                <p className="text-xs sm:text-sm text-offwhite/80 font-sans max-w-xl leading-relaxed">
                  {subtitle}
                </p>
              )}

              {!hideCta && (
                <div className="pt-2">
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-champagne text-[#06191B] hover:bg-champagne-400 font-extrabold text-xs uppercase tracking-[0.18em] transition-all duration-300 shadow-lg hover:-translate-y-0.5"
                  >
                    <span>{campaign.ctaText || 'Shop Sale'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {campaign.showCountdown && endDateIso && (
              <div className="shrink-0 lg:text-right">
                <div className="inline-block bg-[#0A2528]/85 border border-champagne/25 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
                  <CampaignCountdown
                    targetDateIso={endDateIso}
                    serverTimeMs={serverTimeMs}
                    label="Offer Ends In"
                    variant="banner"
                    onExpire={() => router.refresh()}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

