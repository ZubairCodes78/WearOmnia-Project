import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/shop/ProductCard';
import { ChevronRight, Sparkles, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import {
  PRODUCTION_DOMAIN,
  getCanonicalUrl,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { getLiveCampaigns, applyCampaignsToProducts } from '@/lib/campaigns';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
  });

  if (!collection) {
    return {
      title: 'Collection Not Found | WearOMNIA',
      robots: { index: false, follow: false },
    };
  }

  const title = `${collection.name} Collection — Modest Pakistani Fashion | WearOMNIA`;
  const description =
    collection.description ||
    `Explore the ${collection.name} collection by WearOMNIA. Contemporary modest ready-to-wear stitched outfits crafted with premium breathable fabrics, practical pockets, and nationwide COD across Pakistan.`;
  const canonicalUrl = getCanonicalUrl(`/collection/${collection.slug}`);

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
      images: [
        {
          url: `${PRODUCTION_DOMAIN}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${collection.name} Collection — WearOMNIA`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${PRODUCTION_DOMAIN}/images/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const now = new Date();

  const [collection, rawProducts, liveCampaigns] = await Promise.all([
    prisma.collection.findUnique({
      where: { slug },
    }),
    prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { collection: { slug } },
          { category: { slug } },
        ],
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        category: { select: { id: true, name: true, slug: true } },
        collection: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getLiveCampaigns(now),
  ]);

  if (!collection) {
    notFound();
  }

  const products = applyCampaignsToProducts(rawProducts, liveCampaigns);

  // ── JSON-LD Schemas ──────────────────────────────────────────────────────────
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: collection.name, url: `/collection/${collection.slug}` },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${collection.name} Collection | WearOMNIA`,
    description:
      collection.description ||
      `Explore the ${collection.name} modest clothing collection by WearOMNIA.`,
    url: getCanonicalUrl(`/collection/${collection.slug}`),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${collection.name} Collection | WearOMNIA`,
    numberOfItems: products.length,
    itemListElement: products.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: getCanonicalUrl(`/product/${p.slug}`),
      name: p.title,
    })),
  };

  return (
    <div className="editorial-page font-sans text-teal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="editorial-container max-w-7xl space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-charcoal-muted uppercase tracking-wider">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-teal transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li>
              <Link href="/shop" className="hover:text-teal transition-colors">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="text-teal font-semibold" aria-current="page">
              {collection.name}
            </li>
          </ol>
        </nav>

        {/* Collection Header Banner */}
        <header className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
            Curated Atelier Release
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-teal tracking-tight uppercase">
            {collection.name} Collection
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl mx-auto leading-relaxed">
            {collection.description ||
              'Simple, modest, and functional stitched clothing tailored for real everyday routines. Breathable textiles, practical deep pockets, and effortless Pakistani silhouettes.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-charcoal-muted font-medium">
            <Sparkles className="w-3.5 h-3.5 text-champagne-700" />
            <span>
              Showing {products.length} {products.length === 1 ? 'Garment' : 'Garments'}
            </span>
          </div>
        </header>

        {/* Products Listing Grid */}
        {products.length === 0 ? (
          <div className="editorial-surface p-12 text-center max-w-md mx-auto space-y-4">
            <h2 className="font-serif text-2xl font-bold text-teal">Upcoming Releases Soon</h2>
            <p className="text-xs text-charcoal-muted">
              Garments for this collection are currently entering final tailoring. Check back soon or browse all ready-to-wear pieces.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-teal text-champagne px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal-900 transition-all shadow-md"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((product, idx) => (
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
                listName={`${collection.name} Collection`}
                index={idx}
              />
            ))}
          </div>
        )}

        {/* Editorial Trust & Value Proposition Block */}
        <section className="border-t border-sand pt-12 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-charcoal">
          <div className="bg-sand/30 p-5 rounded-2xl border border-sand/60 space-y-2">
            <div className="flex items-center gap-2 text-teal font-bold font-serif text-sm">
              <Truck className="w-4 h-4 text-champagne-700" /> Nationwide Delivery
            </div>
            <p className="text-charcoal-muted leading-relaxed">
              Dispatched swiftly across Pakistan via PostEx and trusted couriers. Cash On Delivery (COD) and 100% Full Advance Payment accepted.
            </p>
          </div>

          <div className="bg-sand/30 p-5 rounded-2xl border border-sand/60 space-y-2">
            <div className="flex items-center gap-2 text-teal font-bold font-serif text-sm">
              <ShieldCheck className="w-4 h-4 text-champagne-700" /> Modesty With Functionality
            </div>
            <p className="text-charcoal-muted leading-relaxed">
              Every garment is engineered around everyday practicality — featuring modest cuts, deep pockets where noted, and durable stitching.
            </p>
          </div>

          <div className="bg-sand/30 p-5 rounded-2xl border border-sand/60 space-y-2">
            <div className="flex items-center gap-2 text-teal font-bold font-serif text-sm">
              <RotateCcw className="w-4 h-4 text-champagne-700" /> 7-Day Easy Exchange
            </div>
            <p className="text-charcoal-muted leading-relaxed">
              Need a size change or alteration? Enjoy our hassle-free 7-day exchange window with personal WhatsApp concierge support.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

