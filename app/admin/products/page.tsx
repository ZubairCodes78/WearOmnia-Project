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

  return <ProductsClient initialProducts={products} categories={categories} collections={collections} />;
}
