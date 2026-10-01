import React from 'react';
import { prisma } from '@/lib/prisma';
import { CatalogClient } from '@/components/shop/CatalogClient';
import { generateCategoryMetadata, generateBreadcrumbSchema } from '@/lib/seo';

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    wishlist?: string;
    preorder?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps) {
  const { category, search, preorder, wishlist } = await searchParams;
  let title = 'Shop All Outfits & Modest Fashion';
  let description =
    'Discover WearOMNIA luxury stitched dresses, flowing kaftans, and contemporary modest wear. Handcrafted in Pakistan with nationwide express Cash On Delivery.';

  if (preorder === 'true') {
    title = 'Pre-Order Collection — Advance Booking';
    description = 'Reserve upcoming handcrafted garments with 50% advance booking. Limited seasonal batch.';
  } else if (category) {
    const formattedCat = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    title = `${formattedCat} Collection — Modest Pakistani Wear`;
    description = `Explore the ${formattedCat} collection by WearOMNIA. Premium breathable fabrics and effortless silhouettes.`;
  } else if (search) {
    title = `Search: "${search}"`;
    description = `Search results for "${search}" in WearOMNIA modest clothing collections.`;
  } else if (wishlist === 'true') {
    title = 'Saved Favorites';
    description = 'Your saved WearOMNIA favorite outfits and coordinates.';
  }

  const isFiltered = Boolean(search || wishlist === 'true');
  return generateCategoryMetadata(title, description, '/shop', isFiltered);
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'PUBLISHED' },
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

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <CatalogClient
        products={products}
        categories={categories}
        initialCategory={params.category || ''}
        initialSearch={params.search || ''}
        initialWishlist={params.wishlist === 'true'}
        initialPreOrder={params.preorder === 'true'}
      />
    </>
  );
}
