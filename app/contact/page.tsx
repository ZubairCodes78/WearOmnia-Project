import React from 'react';
import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema } from '@/lib/seo';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/contact`;

export const metadata: Metadata = {
  title: 'Contact Us | Customer Support & Styling Inquiries | WearOMNIA',
  description:
    'Get in touch with WearOMNIA customer support. Contact us for order tracking, size advice, Lahore dispatch details, or instant WhatsApp assistance.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Contact Us | Customer Support & Styling Inquiries | WearOMNIA',
    description:
      'Get in touch with WearOMNIA customer support. Contact us for order tracking, size advice, Lahore dispatch details, or instant WhatsApp assistance.',
    url: CANONICAL_URL,
    siteName: 'WearOMNIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | WearOMNIA Customer Care',
    description:
      'Contact WearOMNIA for Cash On Delivery orders, sizing assistance, and nationwide courier updates.',
  },
};

export default function ContactPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact Us', url: '/contact' },
  ]);

  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${CANONICAL_URL}#contactpage`,
    url: CANONICAL_URL,
    name: 'Contact WearOMNIA Customer Support',
    description:
      'Reach out to WearOMNIA for modest fashion sizing guidance, order dispatch assistance, and Cash On Delivery inquiries across Pakistan.',
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${PRODUCTION_DOMAIN}/#website`,
    },
    mainEntity: {
      '@type': 'Organization',
      '@id': `${PRODUCTION_DOMAIN}/#organization`,
      name: 'WearOMNIA',
      telephone: '+92-318-0633323',
      email: 'wearomniaa@gmail.com',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+92-318-0633323',
          contactType: 'customer service',
          areaServed: 'PK',
          availableLanguage: ['en', 'ur'],
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <ContactClient />
    </>
  );
}
