import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductClient } from './ProductClient';
import { generateProductMetadata, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import {
  getLiveCampaigns,
  resolveProductCampaignPricing,
  applyCampaignsToProducts,
} from '@/lib/campaigns';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, category: true },
  });
  if (!product) return {};
  return generateProductMetadata(product);
}

export const dynamic = 'force-dynamic';

import { getPreOrderSettings } from '@/lib/settings';

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const now = new Date();
  const [preOrderSettings, liveCampaigns] = await Promise.all([
    getPreOrderSettings(),
    getLiveCampaigns(now),
  ]);

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
      variants: true,
      category: true,
      collection: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch related products in same category if categoryId exists
  let relatedProducts: any[] = [];
  if (product.categoryId) {
    relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'PUBLISHED',
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        category: true,
        collection: true,
      },
      take: 4,
    });
  }

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

  const productSchema = generateProductSchema({
    ...sanitizedProduct,
    discountPrice:
      productCampaignPricing.effectiveSellingPrice < product.basePrice
        ? productCampaignPricing.effectiveSellingPrice
        : product.discountPrice,
  });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
  ];
  if (product.category?.name && product.category?.slug) {
    breadcrumbs.push({
      name: product.category.name,
      url: `/shop?category=${product.category.slug}`,
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
