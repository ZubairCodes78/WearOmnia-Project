import { MetadataRoute } from 'next';
import { PRODUCTION_DOMAIN } from '@/lib/seo';

export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  const baseUrl = PRODUCTION_DOMAIN;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/product/',
          '/our-story',
          '/founder',
          '/contact',
          '/faq',
          '/size-guide',
          '/policies/',
          '/images/',
          '/_next/static/',
          '/favicon.ico',
          '/site.webmanifest',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
          '/cart',
          '/order-success/',
          '/track-order',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
