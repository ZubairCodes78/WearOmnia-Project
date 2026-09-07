import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wearomnia.com';

  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];

  try {
    products = await prisma.product.findMany({ select: { slug: true, updatedAt: true } });
    categories = await prisma.category.findMany({ select: { slug: true, updatedAt: true } });
  } catch (e) {
    console.warn('[Sitemap Build Fallback] DB not reachable at build time, rendering static routes.');
  }

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const categoryUrls = categories.map((c) => ({
    url: `${baseUrl}/shop?category=${c.slug}`,
    lastModified: c.updatedAt,
  }));

  const staticUrls = [
    '',
    '/shop',
    '/our-story',
    '/contact',
    '/faq',
    '/policies/shipping',
    '/policies/returns',
    '/policies/refund',
    '/policies/privacy',
    '/policies/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
