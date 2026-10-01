import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { PRODUCTION_DOMAIN } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = PRODUCTION_DOMAIN;

  let products: { slug: string; updatedAt: Date }[] = [];

  try {
    products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (e) {
    console.warn('[Sitemap Build Fallback] DB not reachable at build time, rendering static routes.');
  }

  // Find most recent product update timestamp for dynamic collections
  const latestProductUpdate = products.length > 0 && products[0]?.updatedAt
    ? products[0].updatedAt
    : new Date('2026-09-30T19:57:54.000Z');

  // Dynamic published product pages (each with its authentic DB updatedAt)
  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Core public indexable pages with stable, authentic last modified dates
  const corePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: latestProductUpdate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: latestProductUpdate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/founder`,
      lastModified: new Date('2026-09-30T14:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/our-story`,
      lastModified: new Date('2026-09-30T14:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: new Date('2026-09-25T12:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-09-25T12:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date('2026-09-25T12:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/policies/shipping`,
      lastModified: new Date('2026-09-20T10:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/returns`,
      lastModified: new Date('2026-09-20T10:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/refund`,
      lastModified: new Date('2026-09-20T10:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/privacy`,
      lastModified: new Date('2026-09-20T10:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/terms`,
      lastModified: new Date('2026-09-20T10:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...corePages, ...productUrls];
}
