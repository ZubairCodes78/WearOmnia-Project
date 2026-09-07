import React from 'react';

// ─── Coming Soon Mode ────────────────────────────────────────────────────────
// Set COMING_SOON="true" or NEXT_PUBLIC_COMING_SOON="true" in environment to show Coming Soon.
function checkIsComingSoon(): boolean {
  return (
    process.env.NEXT_PUBLIC_COMING_SOON === 'true' ||
    process.env.COMING_SOON === 'true'
  );
}

// ─── Coming Soon (no store shell) ───────────────────────────────────────────
import { ComingSoonPage } from '@/components/ComingSoonPage';

// ─── Live Storefront imports (only used when coming soon is false) ────────
import { prisma } from '@/lib/prisma';
import { HeroSlider } from '@/components/home/HeroSlider';
import { ProductCard } from '@/components/shop/ProductCard';
import { BrandStory } from '@/components/home/BrandStory';
import { WhyWearOmnia } from '@/components/home/WhyWearOmnia';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { PageTransition } from '@/components/layout/PageTransition';

async function getLaunchProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      include: { images: true, variants: true, category: true },
      take: 4,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // ── Coming Soon Mode ─────────────────────────────────────────────────────
  if (checkIsComingSoon()) {
    return <ComingSoonPage />;
  }

  // ── Live Storefront ──────────────────────────────────────────────────────
  const launchProducts = await getLaunchProducts();

  return (
    <PageTransition>
      <div className="space-y-24 bg-offwhite pb-16">
        {/* Editorial Hero Slider */}
        <HeroSlider />

        {/* Exclusive Single Product Launch Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              The Daily Rotation
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-teal tracking-tight">
              The Ones You'll Reach For Again.
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted font-sans max-w-md mx-auto">
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
                inStock={product.inStock}
                stockQuantity={product.stockQuantity}
                images={product.images}
                categoryName={product.category?.name}
                variants={product.variants}
              />
            ))}
          </div>

          <div className="text-center pt-10">
            <a
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal text-champagne font-bold text-xs uppercase tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl border border-champagne/30 hover:-translate-y-0.5"
            >
              Explore Full Collection →
            </a>
          </div>
        </section>

        {/* 6 Luxury Icon Cards */}
        <WhyWearOmnia />

        {/* Authentic Founder Story: OUR STORY */}
        <BrandStory />

        {/* VIP Newsletter Registration */}
        <NewsletterSection />
      </div>
    </PageTransition>
  );
}
