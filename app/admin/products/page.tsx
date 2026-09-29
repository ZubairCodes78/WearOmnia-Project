import React from 'react';
import { prisma } from '@/lib/prisma';
import { ProductsClient } from '@/app/admin/products/ProductsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        category: true,
        collection: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany(),
    prisma.collection.findMany(),
  ]);

  const mappedProducts = products.map((p) => ({
    ...p,
    sizeGuideImage: p.images.find((img) => img.altText === 'SIZE_GUIDE')?.url || null,
    images: p.images.filter((img) => img.altText !== 'SIZE_GUIDE'),
  }));

  return <ProductsClient initialProducts={mappedProducts} categories={categories} collections={collections} />;
}
