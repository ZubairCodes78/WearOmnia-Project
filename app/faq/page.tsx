import React from 'react';
import type { Metadata } from 'next';
import FaqClient from './FaqClient';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema, generateFaqSchema } from '@/lib/seo';
import { getPublicSiteSettings } from '@/lib/settings';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/faq`;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Orders, Payments, Delivery & Sizing | WearOMNIA',
  description:
    'Find clear answers about WearOMNIA: Cash on Delivery, 100% Full Advance Payment with screenshot verification, order tracking, shipping charges, 7-day exchanges, and sizing.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | WearOMNIA',
    description:
      'Answers about Cash on Delivery, Full Advance Payment, nationwide Pakistan delivery, 7-day exchanges, and sizing guidance.',
    url: CANONICAL_URL,
    siteName: 'WearOMNIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions | WearOMNIA',
    description:
      'Everything you need to know about ordering, COD & Full Advance payments, tracking, and deliveries across Pakistan.',
  },
};

export const dynamic = 'force-dynamic';

export default async function FAQPage() {
  const settings = await getPublicSiteSettings();
  const thresholdStr =
    settings.freeShippingThreshold > 0
      ? `Rs. ${settings.freeShippingThreshold.toLocaleString()} or above`
      : 'all orders';

  const visibleFaqs = [
    {
      question: 'What is WearOMNIA?',
      answer:
        'WearOMNIA is a Pakistani modest women’s fashion brand built around "Modesty With Functionality." We design stitched modest outfits tailored for everyday comfort, practical wearability, and thoughtful details such as functional side pockets on select silhouettes.',
    },
    {
      question: 'Do I need an account to place an order?',
      answer:
        'No. WearOMNIA uses a Guest Checkout model. You can add garments to your bag, fill in your delivery details, choose your payment option, and complete your order without creating a password or account.',
    },
    {
      question: 'What payment options are available?',
      answer:
        'For regular in-stock products across Pakistan, you can choose either Cash on Delivery (COD) or 100% Full Advance Payment via our official bank or mobile wallet accounts listed at checkout. When designated pre-order drops are enabled, pre-order advance booking terms apply.',
    },
    {
      question: 'How does Full Advance Payment and screenshot verification work?',
      answer:
        'If you select Full Advance Payment (100%) at checkout, transfer 100% of the payable order total (including applicable discounts and shipping) to one of our official payment accounts shown at checkout and upload your transaction screenshot. Your order starts with status PAYMENT_REVIEW_PENDING while our team manually verifies the screenshot before confirmation and dispatch. If a screenshot cannot be verified, you can resubmit a clearer proof on your order page without placing a duplicate order.',
    },
    {
      question: 'How do I track my WearOMNIA order?',
      answer:
        'Visit our Track Your Order page (/track-order) and enter your order number or courier tracking ID along with your mobile number to view real-time status and courier updates.',
    },
    {
      question: 'What are the delivery timelines and shipping charges?',
      answer:
        settings.freeShippingThreshold > 0
          ? `Nationwide courier delivery across Pakistan typically takes ${settings.estimatedDeliveryTime || '2-4 business days'}. Shipping is FREE on orders of ${thresholdStr}, while orders below that carry a flat delivery fee of Rs. ${settings.flatShippingFee}.`
          : `Nationwide courier delivery across Pakistan typically takes ${settings.estimatedDeliveryTime || '2-4 business days'}, with FREE shipping on all orders.`,
    },
    {
      question: 'Can I exchange an item if the size does not fit?',
      answer:
        `Yes. WearOMNIA offers a 7-day exchange window from the date of delivery for unworn, unwashed garments with all original tags and packaging intact. Reach out on WhatsApp (${settings.whatsappNumber || '03180633323'}) or email ${settings.storeEmail || 'wearomniaa@gmail.com'} with your order number.`,
    },
    {
      question: 'How can I find my correct size before ordering?',
      answer:
        'Check our Size Guide (/size-guide) or click the Size Guide link on any product page to inspect exact chest, waist, hip, and length charts. Our WhatsApp support team can also assist with fit questions.',
    },
    {
      question: 'Do WearOMNIA garments have pockets?',
      answer:
        'Select WearOMNIA designs include functional side pockets (for example, specific trousers and silhouettes). Each product page lists pockets only when that specific garment includes them.',
    },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  const faqPageSchema = {
    ...generateFaqSchema(visibleFaqs),
    '@id': `${CANONICAL_URL}#faq`,
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
      <FaqClient faqs={visibleFaqs} />
    </>
  );
}
