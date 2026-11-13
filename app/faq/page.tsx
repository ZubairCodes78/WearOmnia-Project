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
        'WearOMNIA is a modern Pakistani modest women’s fashion brand built around the philosophy of "Modesty With Functionality." Founded by Virago Baji in Lahore, Pakistan, WearOMNIA designs premium stitched pret and ready-to-wear silhouettes that combine graceful modest coverage, breathability, and practical daily utility (such as concealed functional pockets on select styles).',
    },
    {
      question: 'What type of clothing does WearOMNIA sell?',
      answer:
        'WearOMNIA specializes in stitched modest pret wear for women, featuring contemporary Pakistani silhouettes such as Slub Khaddar Angrakha 3-piece suits (complete with matching trousers and dupattas) and textured winter cotton tunics and shirts. Every garment is crafted with premium natural fabrics, durable stitching, and tailored cuts suitable for university, professional workplaces, family gatherings, and everyday elegance.',
    },
    {
      question: 'How can I order from WearOMNIA?',
      answer:
        'Ordering is fast and effortless through our 1-click Guest Checkout model. Simply browse our collection (/shop), choose your size using our detailed measurement charts, add items to your bag, enter your shipping address and contact number, and select your preferred payment method (Cash on Delivery or 100% Full Advance Payment). No account registration or password creation is required.',
    },
    {
      question: 'What payment options are available?',
      answer:
        'For regular in-stock orders delivered across Pakistan, WearOMNIA offers two secure checkout payment methods: 1) Cash on Delivery (COD), allowing you to pay the courier in cash upon arrival, and 2) 100% Full Advance Payment via official Pakistani bank transfer or mobile wallet accounts (such as SadaPay and Easypaisa, as configured in checkout) with instant receipt upload.',
    },
    {
      question: 'Is Cash on Delivery (COD) available?',
      answer:
        'Yes. Cash on Delivery (COD) is available nationwide across all cities, towns, and regions in Pakistan serviced by our courier partners (including our integrated courier PostEx and domestic delivery networks). Simply select "Cash on Delivery" at checkout, and you pay the exact order total in cash directly to the courier rider at your doorstep.',
    },
    {
      question: 'How does Full Advance Payment work?',
      answer:
        'When you select Full Advance Payment (100%) at checkout, the system calculates 100% of your final payable order amount (including any active discount campaigns, coupon codes, and shipping charges). Our official bank account and mobile wallet details along with payment instructions are displayed. Transfer the exact amount via your banking app, upload your transaction screenshot or receipt, and submit your order.',
    },
    {
      question: 'How does pre-order payment work?',
      answer:
        'For limited-edition or advance launch collections where pre-ordering is enabled by store administration, customers can reserve garments ahead of public release. Pre-orders specify dedicated advance booking terms (such as an advance reservation deposit or full advance booking as indicated on the product page), with manual payment verification and scheduled dispatch upon production completion.',
    },
    {
      question: 'How are payment screenshots verified?',
      answer:
        'When an order is placed with Full Advance Payment or pre-order advance booking, it is assigned the status PAYMENT_REVIEW_PENDING. Our finance team manually reviews the uploaded banking screenshot against our official account statements to verify the transaction ID, sender details, and amount. Once verified, the order status updates to CONFIRMED and proceeds to fulfillment. If a screenshot is illegible or incorrect, customers are notified and can resubmit a clear screenshot directly on their order status page without placing a duplicate order.',
    },
    {
      question: 'How can customers track their orders?',
      answer:
        'You can track your parcel in real time by visiting our dedicated Track Your Order page (/track-order). Enter your WearOMNIA order number (e.g., WO-1001) or courier tracking ID along with your phone number to view live courier tracking updates, dispatch status, and estimated delivery dates.',
    },
    {
      question: 'What are the shipping policies and delivery timelines?',
      answer:
        settings.freeShippingThreshold > 0
          ? `Nationwide delivery across Pakistan typically takes ${settings.estimatedDeliveryTime || '2-4 business days'}. Shipping is completely FREE on orders of ${thresholdStr}, while orders below that threshold carry a transparent flat delivery fee of Rs. ${settings.flatShippingFee}. Tracking details are shared via SMS and WhatsApp upon courier booking.`
          : `Nationwide delivery across Pakistan typically takes ${settings.estimatedDeliveryTime || '2-4 business days'}, with FREE shipping on all orders nationwide. Tracking details are shared via SMS and WhatsApp upon courier booking.`,
    },
    {
      question: 'What are the return and exchange policies?',
      answer:
        `WearOMNIA offers a hassle-free 7-day exchange window from the date your parcel is delivered. If you need a different size or wish to exchange an item, contact our customer support team on WhatsApp (${settings.whatsappNumber || '03180633323'}) or email ${settings.storeEmail || 'wearomniaa@gmail.com'} within 7 days. Garments must be unworn, unwashed, and in their original packaging with all tags attached.`,
    },
    {
      question: 'How can customers select their correct size?',
      answer:
        'Each product page features a link to our detailed Size Guide (/size-guide) with exact measurements for Small, Medium, Large, and Extra Large across bust/chest, waist, hips, shirt length, sleeve length, and trouser length in both inches and centimeters. We strongly recommend comparing these measurements against a well-fitting outfit you already own. If you are between sizes, our WhatsApp styling team is available to assist you with personalized sizing recommendations.',
    },
    {
      question: 'Do WearOMNIA garments have pockets?',
      answer:
        'Yes! True to our "Modesty With Functionality" ethos, select WearOMNIA trousers and silhouettes feature deep, functional side pockets designed to securely hold your smartphone, keys, or cards. Each product page explicitly states whether pockets are included for that specific garment.',
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
