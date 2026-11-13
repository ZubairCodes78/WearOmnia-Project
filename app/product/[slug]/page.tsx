import React from 'react';
import { notFound } from 'next/navigation';
import { ProductClient } from './ProductClient';
import { generateProductMetadata, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import {
  getLiveCampaigns,
  resolveProductCampaignPricing,
  applyCampaignsToProducts,
} from '@/lib/campaigns';
import {
  getPublishedProductBySlugCached,
  getPublishedProductsCached,
} from '@/lib/storefront-cache';
import { getPreOrderSettings, getPublicSiteSettings } from '@/lib/settings';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugCached(slug);
  if (!product) return {};
  const meta = generateProductMetadata(product);
  if (product.status !== 'PUBLISHED') {
    return { ...meta, robots: { index: false, follow: false } };
  }
  return meta;
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const now = new Date();
  const [preOrderSettings, publicSiteSettings, liveCampaigns, product, allPublished] =
    await Promise.all([
      getPreOrderSettings(),
      getPublicSiteSettings(),
      getLiveCampaigns(now),
      getPublishedProductBySlugCached(slug),
      getPublishedProductsCached(),
    ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.categoryId
    ? allPublished
        .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
        .slice(0, 4)
    : [];

  const rawImages = Array.isArray(product.images) ? product.images : [];
  const sizeGuideImage = rawImages.find((img: any) => img.altText === 'SIZE_GUIDE')?.url || null;
  const galleryImages = rawImages.filter((img: any) => img.altText !== 'SIZE_GUIDE');

  const productCampaignPricing = resolveProductCampaignPricing(product, liveCampaigns);

  const sanitizedProduct = {
    ...product,
    images: galleryImages,
    sizeGuideImage,
    variants: Array.isArray(product.variants) ? product.variants : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    campaignPricing: productCampaignPricing,
  };

  const sanitizedRelatedRaw = relatedProducts.map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images.filter((img: any) => img.altText !== 'SIZE_GUIDE') : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
  }));
  const sanitizedRelated = applyCampaignsToProducts(sanitizedRelatedRaw, liveCampaigns);

  const productSchema = generateProductSchema(
    {
      ...sanitizedProduct,
      discountPrice:
        productCampaignPricing.effectiveSellingPrice < product.basePrice
          ? productCampaignPricing.effectiveSellingPrice
          : product.discountPrice,
    },
    {
      flatShippingFee: publicSiteSettings.flatShippingFee,
      freeShippingThreshold: publicSiteSettings.freeShippingThreshold,
    }
  );

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
  ];
  if (product.category?.name && product.category?.slug) {
    breadcrumbs.push({
      name: product.category.name,
      url: `/collection/${product.category.slug}`,
    });
  }
  breadcrumbs.push({
    name: product.title,
    url: `/product/${product.slug}`,
  });
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductClient
        product={sanitizedProduct}
        relatedProducts={sanitizedRelated}
        defaultAdvancePercent={preOrderSettings.preorder_advance_percent || 50}
        serverTimeMs={now.getTime()}
      />
    </>
  );
}
