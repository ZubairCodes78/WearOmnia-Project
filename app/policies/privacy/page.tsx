import React from 'react';
import type { Metadata } from 'next';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema } from '@/lib/seo';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/policies/privacy`;

export const metadata: Metadata = {
  title: 'Privacy Policy | Guest Checkout & Data Protection | WearOMNIA',
  description:
    'WearOMNIA data protection policy. How we safeguard customer contact details for Cash On Delivery dispatch without storing passwords or selling personal data.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Privacy Policy | WearOMNIA',
    description: 'Data protection policies for WearOMNIA customer orders across Pakistan.',
    url: CANONICAL_URL,
  },
};

export default function PrivacyPolicyPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/policies/privacy' },
  ]);

  return (
    <div className="editorial-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="editorial-container max-w-4xl">
        <div className="editorial-header">
          <span className="editorial-kicker">Data Protection</span>
          <h1 className="editorial-title">Privacy Policy</h1>
        </div>
        <div className="editorial-dossier font-sans">
          <p>
            At WearOMNIA, we value customer privacy. Because we operate on a <strong>Guest Checkout Only</strong> model, we collect only the contact and shipping details needed to fulfill your Cash On Delivery and Full Advance orders across Pakistan (Full Name, Delivery Address, Phone/WhatsApp Number).
          </p>
          <p>
            Payment verification screenshots uploaded for advance orders are stored strictly in private object storage accessible only to authorized store administrators for manual verification, and are never published on public URLs. We never store customer passwords, card numbers, or sell personal information to third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
