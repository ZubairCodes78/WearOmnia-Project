import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Public Catalog & Taxonomy Cache Layer
 *
 * Strictly caches ONLY non-personalized, public storefront catalog records.
 * NEVER caches Admin data, customer details, cart totals, payment screenshots, or orders.
 */

export const getCategoriesCached = unstable_cache(
  async () => {
    try {
      return await prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      console.error('Failed to read cached categories:', error);
      return [];
    }
  },
  ['public-categories'],
  { tags: ['categories'], revalidate: 300 }
);

export const getPublishedProductsCached = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          variants: true,
          category: { select: { id: true, name: true, slug: true } },
          collection: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to read cached published products:', error);
      return [];
    }
  },
  ['public-published-products'],
  { tags: ['products'], revalidate: 120 }
);

export async function getPublishedProductBySlugCached(slug: string) {
  const cachedLookup = unstable_cache(
    async (targetSlug: string) => {
      try {
        return await prisma.product.findUnique({
          where: { slug: targetSlug },
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
      } catch (error) {
        console.error('Failed to read cached product by slug:', error);
        return null;
      }
    },
    ['public-product-by-slug', slug],
    { tags: ['products', `product:${slug}`], revalidate: 120 }
  );

  return cachedLookup(slug);
}

export function revalidateCatalogCaches(slug?: string) {
  try {
    revalidateTag('products');
    revalidateTag('categories');
    if (slug) {
      revalidateTag(`product:${slug}`);
      revalidatePath(`/product/${slug}`);
    }
    revalidatePath('/', 'layout');
    revalidatePath('/shop');
    revalidatePath('/sitemap.xml');
  } catch {
    // Graceful no-op outside Next request lifecycle (e.g. CLI test scripts)
  }
}

