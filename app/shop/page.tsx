import React from 'react';
import { prisma } from '@/lib/prisma';
import { CatalogClient } from '@/components/shop/CatalogClient';
import { generateCategoryMetadata } from '@/lib/seo';

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    wishlist?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps) {
  const { category, search } = await searchParams;
  let title = 'Shop Our Collection | WearOMNIA';
  let description = 'Explore our latest modest and stylish stitched clothing.';
  if (category) {
    title = `${category.replace('-', ' ').toUpperCase()} Collection | WearOMNIA`;
  } else if (search) {
    title = `Search Results for "${search}" | WearOMNIA`;
  }
  return generateCategoryMetadata(title, description);
}

export const dynamic = 'force-dynamic';

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        category: true,
        collection: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <CatalogClient
      products={products}
      categories={categories}
      initialCategory={params.category || ''}
      initialSearch={params.search || ''}
      initialWishlist={params.wishlist === 'true'}
    />
  );
}
