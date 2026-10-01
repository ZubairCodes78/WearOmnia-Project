import React from 'react';
import type { Metadata } from 'next';
import FaqClient from './FaqClient';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema } from '@/lib/seo';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/faq`;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Orders, Delivery & Sizing | WearOMNIA',
  description:
    'Find answers to WearOMNIA questions: Cash On Delivery, nationwide courier dispatch, size exchanges, guest checkout, fabric care, and preorder timelines.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | WearOMNIA Modest Wear',
    description:
      'Answers about nationwide Cash On Delivery, 7-day exchanges, sizing guidance, and Lahore dispatch timelines.',
    url: CANONICAL_URL,
    siteName: 'WearOMNIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions | WearOMNIA',
    description:
      'Everything you need to know about placing Cash On Delivery orders, sizing, and deliveries across Pakistan.',
  },
};

const STATIC_FAQS = [
  {
    q: 'Do I need an account to place an order?',
    a: 'No! WearOMNIA enforces a strict Guest Checkout model. You never need to register or create an account. Simply add items to your bag, enter your shipping details, and place your order in seconds.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We strictly offer Cash On Delivery (COD) across 200+ cities in Pakistan. You pay in cash to the courier representative when your parcel is handed over.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Nationwide delivery takes 2-4 business days. Major cities such as Lahore, Karachi, Islamabad, and Rawalpindi receive deliveries within 2-3 business days.',
  },
  {
    q: 'Is shipping free?',
    a: 'Yes, nationwide shipping is completely FREE on eligible orders above the threshold, with a clear flat delivery fee for standard smaller orders.',
  },
  {
    q: 'What is the unstitched suit fabric composition?',
    a: 'Our unstitched lawn collections feature high-count 80/80 printed lawn shirts, schiffli embroidered neck patches, and 100% Bamber chiffon or pure silk dupattas.',
  },
  {
    q: 'Can I exchange an item if it doesn’t fit?',
    a: 'Yes, we provide a 7-day hassle-free exchange window. Simply contact our WhatsApp concierge or customer support with your order number.',
  },
];

export default function FAQPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${CANONICAL_URL}#faq`,
    mainEntity: STATIC_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <FaqClient />
    </>
  );
}
