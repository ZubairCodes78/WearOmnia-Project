import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { formatKarachiDateTime } from '@/lib/coupons';
import {
  toPublicCampaign,
  getEffectiveCampaignPhase,
  filterProductsForCampaign,
  resolveProductCampaignPricing,
} from '@/lib/campaigns';
import { getPublishedProductsCached } from '@/lib/storefront-cache';
import { getCanonicalUrl, generateBreadcrumbSchema, PRODUCTION_DOMAIN } from '@/lib/seo';
import { CampaignBanner } from '@/components/campaigns/CampaignBanner';
import { CampaignCountdown } from '@/components/campaigns/CampaignCountdown';
import { ProductCard } from '@/components/shop/ProductCard';
import { ArrowRight, Calendar, Eye, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SalePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SalePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const campaign = await prisma.campaign.findUnique({ where: { slug } });

  if (!campaign) {
    return {
      title: 'Sale Not Found | WearOMNIA',
      robots: { index: false, follow: false },
    };
  }

  const phase = getEffectiveCampaignPhase(campaign, new Date());
  const isPublicLive = phase.isLive && campaign.landingPageEnabled && !preview;

  const title = campaign.seoTitle || `${campaign.publicTitle} | WearOMNIA`;
  const description =
    campaign.seoDescription ||
    campaign.landingPageDescription ||
    campaign.bannerSubtitle ||
    `Shop ${campaign.publicTitle} on WearOMNIA — limited time seasonal savings on luxury modest fashion across Pakistan.`;
  const canonicalUrl = getCanonicalUrl(`/sale/${campaign.slug}`);
  const ogImage = campaign.desktopBannerUrl || `${PRODUCTION_DOMAIN}/images/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'WearOMNIA',
      locale: 'en_PK',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: campaign.publicTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: isPublicLive
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function CampaignLandingPage({ params, searchParams }: SalePageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const campaignRow = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaignRow) {
    notFound();
  }

  const now = new Date();
  const phase = getEffectiveCampaignPhase(campaignRow, now);
  const campaign = toPublicCampaign(campaignRow);

  const isPreviewAuthorized = Boolean(
    (preview && campaignRow.previewToken && preview === campaignRow.previewToken) ||
      (preview !== undefined && (await verifyAdminSession()))
  );

  // 1. Scheduled Upcoming Teaser (without revealing active discount pricing yet)
  if (!isPreviewAuthorized && phase.effectiveStatus === 'SCHEDULED' && campaign.landingPageEnabled) {
    const startIso = campaign.startDate ? new Date(campaign.startDate).toISOString() : null;
    return (
      <div className="min-h-[70vh] bg-offwhite py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-[#06191B] text-offwhite rounded-3xl border border-champagne/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-champagne/15 border border-champagne/40 text-champagne text-[10px] font-black uppercase tracking-[0.22em]">
            <Calendar className="w-3.5 h-3.5" /> Upcoming Seasonal Release
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-offwhite tracking-tight">
            {campaign.publicTitle}
          </h1>
          <p className="text-xs sm:text-sm text-offwhite/80 leading-relaxed max-w-lg mx-auto">
            Launching on <strong>{formatKarachiDateTime(campaign.startDate)}</strong> (Asia/Karachi).
            Prepare your wishlist ahead of time — seasonal pricing goes live automatically at launch.
          </p>
          {startIso && (
            <div className="pt-2 flex justify-center">
              <CampaignCountdown
                targetDateIso={startIso}
                serverTimeMs={now.getTime()}
                label="Launching In"
                variant="banner"
              />
            </div>
          )}
          <div className="pt-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-champagne text-[#06191B] font-extrabold text-xs uppercase tracking-widest hover:bg-champagne-400 transition-all"
            >
              Explore Current Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unpublished / Paused / Expired / Disabled Gate (unless Admin Preview is authorized)
  if (!isPreviewAuthorized && (!phase.isLive || !campaign.landingPageEnabled)) {
    const endedLabel =
      phase.effectiveStatus === 'COMPLETED'
        ? 'This Seasonal Sale Has Concluded'
        : 'Campaign Currently Unavailable';

    return (
      <div className="min-h-[68vh] bg-offwhite py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-sand p-8 sm:p-12 text-center space-y-5 shadow-xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-sand text-teal text-[10px] font-black uppercase tracking-widest">
            WearOMNIA Archive
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-teal">
            {endedLabel}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            <strong>{campaign.publicTitle}</strong> is no longer active. Discover our full collection of modest everyday silhouettes and seasonal drops in the boutique.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-teal text-champagne font-bold text-xs uppercase tracking-widest hover:bg-teal-900 transition-all shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Full Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Live Campaign Landing Page OR Authorized Admin Preview
  const allPublished = await getPublishedProductsCached();

  const eligibleRaw = filterProductsForCampaign(allPublished, campaign);
  // On preview mode, calculate pricing explicitly against this campaign even if status is DRAFT/SCHEDULED
  const eligibleProducts = eligibleRaw.map((p) => ({
    ...p,
    campaignPricing: resolveProductCampaignPricing(p, [campaign]),
  }));

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: campaign.publicTitle, url: `/sale/${campaign.slug}` },
  ]);

  return (
    <div className="bg-offwhite min-h-screen py-8 sm:py-12 space-y-10 sm:space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />

      {isPreviewAuthorized && !phase.isLive && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-500/15 border border-amber-500/40 text-amber-950 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 font-bold">
              <Eye className="w-4 h-4 text-amber-700" />
              ADMIN PREVIEW MODE ({phase.label}) — Customers cannot see this sale pricing until active.
            </span>
            <Link
              href="/admin/campaigns"
              className="underline font-bold text-teal hover:text-champagne-700"
            >
              Return to Campaign Manager →
            </Link>
          </div>
        </div>
      )}

      {/* Campaign Header / Banner */}
      <CampaignBanner
        campaign={campaign}
        serverTimeMs={now.getTime()}
        hideCta={true}
      />

      {/* Eligible Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-sand pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-champagne-700 block">
              Curated Sale Selection
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-teal">
              {campaign.publicTitle} ({eligibleProducts.length} {eligibleProducts.length === 1 ? 'Piece' : 'Pieces'})
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold uppercase tracking-wider text-teal hover:text-champagne-700 underline"
          >
            View All Storefront Products →
          </Link>
        </div>

        {eligibleProducts.length === 0 ? (
          <div className="bg-white border border-sand rounded-2xl p-12 text-center space-y-3">
            <h2 className="font-serif text-xl font-bold text-teal">
              No Eligible Products Currently Available
            </h2>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto">
              Check back soon or browse all available garments in the WearOMNIA boutique.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-champagne text-xs font-bold uppercase tracking-widest mt-2"
            >
              Shop All Arrivals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {eligibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                slug={product.slug}
                basePrice={product.basePrice}
                discountPrice={product.discountPrice}
                sku={product.sku}
                isNewArrival={product.isNewArrival}
                isBestSeller={product.isBestSeller}
                isPreOrder={product.isPreOrder}
                inStock={product.inStock}
                stockQuantity={product.stockQuantity}
                images={product.images}
                categoryName={product.category?.name}
                variants={product.variants}
                campaignPricing={product.campaignPricing}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

