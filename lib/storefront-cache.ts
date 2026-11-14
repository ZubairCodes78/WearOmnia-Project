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

const PRODUCT_INCLUDE_TREE = {
  images: { orderBy: { displayOrder: 'asc' as const } },
  variants: true,
  category: true,
  collection: true,
  reviews: {
    where: { isApproved: true },
    select: {
      id: true,
      productId: true,
      customerName: true,
      rating: true,
      comment: true,
      imageUrl: true,
      verifiedPurchase: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

/**
 * Normalizes a raw URL slug: decodes URI components, replaces en-dashes/underscores,
 * strips duplicate hyphens, trims, and converts to lowercase.
 */
export function normalizeProductSlug(rawSlug: string): string {
  if (!rawSlug) return '';
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    decoded = rawSlug;
  }
  return decoded
    .trim()
    .toLowerCase()
    .replace(/[\u2013\u2014_]/g, '-') // en-dash, em-dash, underscore to hyphen
    .replace(/-+/g, '-')             // collapse duplicate hyphens
    .replace(/(^-|-$)/g, '');        // trim leading/trailing hyphens
}

/**
 * Robust product slug resolver:
 * 1. Checks exact normalized slug against PUBLISHED products.
 * 2. Checks prefix/base slug (e.g. without 4-char random ID suffix).
 * 3. Checks product UUID if a direct ID is supplied.
 * Returns { product, isCanonical: boolean, canonicalSlug: string }
 */
export async function resolveProductBySlug(rawSlug: string) {
  const normalized = normalizeProductSlug(rawSlug);
  if (!normalized) return { product: null, isCanonical: false, canonicalSlug: '' };

  try {
    // 1. Direct exact slug match
    const exactMatch = await prisma.product.findFirst({
      where: {
        slug: normalized,
        status: 'PUBLISHED',
      },
      include: PRODUCT_INCLUDE_TREE,
    });

    if (exactMatch) {
      const isCanonical = rawSlug === exactMatch.slug;
      return { product: exactMatch, isCanonical, canonicalSlug: exactMatch.slug };
    }

    // 2. Base slug match (matches slugs starting with the requested base slug, e.g. unhashed URLs)
    const baseMatch = await prisma.product.findFirst({
      where: {
        slug: { startsWith: normalized },
        status: 'PUBLISHED',
      },
      include: PRODUCT_INCLUDE_TREE,
    });

    if (baseMatch) {
      return { product: baseMatch, isCanonical: false, canonicalSlug: baseMatch.slug };
    }

    // 3. Fallback UUID lookup
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)) {
      const idMatch = await prisma.product.findFirst({
        where: {
          id: normalized,
          status: 'PUBLISHED',
        },
        include: PRODUCT_INCLUDE_TREE,
      });

      if (idMatch) {
        return { product: idMatch, isCanonical: false, canonicalSlug: idMatch.slug };
      }
    }

    return { product: null, isCanonical: false, canonicalSlug: '' };
  } catch (error) {
    console.error('Failed to resolve product by slug:', error);
    return { product: null, isCanonical: false, canonicalSlug: '' };
  }
}

export async function getPublishedProductBySlugCached(slug: string) {
  const normalized = normalizeProductSlug(slug);
  if (!normalized) return null;

  const cachedLookup = unstable_cache(
    async (targetSlug: string) => {
      try {
        const result = await prisma.product.findFirst({
          where: {
            slug: targetSlug,
            status: 'PUBLISHED',
          },
          include: PRODUCT_INCLUDE_TREE,
        });
        return result;
      } catch (error) {
        console.error('Failed to read cached product by slug:', error);
        return null;
      }
    },
    ['public-product-by-slug', normalized],
    { tags: ['products', `product:${normalized}`], revalidate: 120 }
  );

  const cached = await cachedLookup(normalized);
  if (cached) return cached;

  // Fallback direct resolution without cache (prevents stale null caching during updates)
  const resolved = await resolveProductBySlug(slug);
  return resolved.product;
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

