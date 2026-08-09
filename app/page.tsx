import React from 'react';
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
  const launchProducts = await getLaunchProducts();

  return (
    <PageTransition>
      <div className="space-y-24 bg-offwhite pb-16">
        {/* Editorial Hero Slider */}
        <HeroSlider />

        {/* Exclusive Single Product Launch Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-champagne-700 block">
              Flagship Collection 2026
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal">
              Inaugural Launch Garment
            </h2>
            <p className="text-xs text-charcoal-muted font-sans">
              Handcrafted in small batches at our Lahore studio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
