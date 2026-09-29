import React from 'react';

import { getCampaignPhase } from '@/lib/preorder';

// ─── Coming Soon Mode ────────────────────────────────────────────────────────
// Enabled when COMING_SOON/NEXT_PUBLIC_COMING_SOON is set and before campaign start (29 Sep 2026).
function checkIsComingSoon(): boolean {
  const envComingSoon =
    process.env.NEXT_PUBLIC_COMING_SOON === 'true' ||
    process.env.COMING_SOON === 'true';

  const phase = getCampaignPhase();
  return envComingSoon && phase === 'BEFORE_LAUNCH';
}

// ─── Coming Soon (no store shell) ───────────────────────────────────────────
import { ComingSoonPage } from '@/components/ComingSoonPage';

// ─── Live Storefront imports (only used when coming soon is false) ────────
import { prisma } from '@/lib/prisma';
import { HeroSlider } from '@/components/home/HeroSlider';
import { ProductCard } from '@/components/shop/ProductCard';
import { BrandStory } from '@/components/home/BrandStory';
import { FounderPreview } from '@/components/home/FounderPreview';
import { WhyWearOmnia } from '@/components/home/WhyWearOmnia';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { PageTransition } from '@/components/layout/PageTransition';

import { PreOrderLaunchOverlay } from '@/components/home/PreOrderLaunchOverlay';

async function getLaunchProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        category: true,
      },
      take: 4,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  // ── Coming Soon Mode ─────────────────────────────────────────────────────
  if (checkIsComingSoon()) {
    return <ComingSoonPage />;
  }

  // ── Live Storefront ──────────────────────────────────────────────────────
  const launchProducts = await getLaunchProducts();

  return (
    <PageTransition>
      {/* Pre-Order Launch Experience Overlay (Active 29 Sep – 20 Oct 2026, Once Per Visitor) */}
      <PreOrderLaunchOverlay />

      <div className="space-y-20 sm:space-y-24 lg:space-y-28 bg-offwhite pb-16">
        {/* Editorial Hero Slider */}
        <HeroSlider />

        {/* Exclusive Single Product Launch Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-12 sm:mb-14">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              The Daily Rotation
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-teal tracking-tight leading-tight">
              The Ones You&apos;ll Reach For Again.
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted font-sans max-w-md mx-auto leading-relaxed">
              Because apparently wearing the same favourite outfit three times a week is frowned upon. Modest, comfortable, and made to be worn on repeat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {launchProducts.map((product) => (
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
              />
            ))}
          </div>

          <div className="text-center pt-10 sm:pt-12">
            <a
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal text-champagne font-bold text-xs uppercase tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-md border border-champagne/30 hover:-translate-y-0.5"
            >
              Explore Full Collection →
            </a>
          </div>
        </section>

        {/* 6 Luxury Icon Cards */}
        <WhyWearOmnia />

        {/* Authentic Founder Story: OUR STORY */}
        <BrandStory />

        {/* Founder Vision Preview */}
        <FounderPreview />

        {/* VIP Newsletter Registration */}
        <NewsletterSection />
      </div>
    </PageTransition>
  );
}
