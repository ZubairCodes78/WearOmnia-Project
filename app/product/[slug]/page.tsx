import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductClient } from './ProductClient';
import { generateProductMetadata, generateProductSchema } from '@/lib/seo';

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

export const revalidate = 120; // ISR: revalidate every 2 minutes

// Pre-render all published product pages at build time
export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

import { getPreOrderSettings } from '@/lib/settings';

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const preOrderSettings = await getPreOrderSettings();

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
      },
      take: 4,
    });
  }

  const rawImages = Array.isArray(product.images) ? product.images : [];
  const sizeGuideImage = rawImages.find((img: any) => img.altText === 'SIZE_GUIDE')?.url || null;
  const galleryImages = rawImages.filter((img: any) => img.altText !== 'SIZE_GUIDE');

  const sanitizedProduct = {
    ...product,
    images: galleryImages,
    sizeGuideImage,
    variants: Array.isArray(product.variants) ? product.variants : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
  };

  const sanitizedRelated = relatedProducts.map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images.filter((img: any) => img.altText !== 'SIZE_GUIDE') : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
  }));

  const jsonLd = generateProductSchema(sanitizedProduct);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient
        product={sanitizedProduct}
        relatedProducts={sanitizedRelated}
        defaultAdvancePercent={preOrderSettings.preorder_advance_percent || 50}
      />
    </>
  );
}
