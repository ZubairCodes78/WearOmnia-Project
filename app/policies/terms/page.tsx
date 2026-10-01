import React from 'react';
import type { Metadata } from 'next';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema } from '@/lib/seo';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/policies/terms`;

export const metadata: Metadata = {
  title: 'Terms of Service | Intellectual Property & Order Conditions | WearOMNIA',
  description:
    'Terms of service and legal agreement for shopping on WearOMNIA. Genuine design rights, pricing in PKR, and nationwide order policies.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Terms of Service | WearOMNIA',
    description: 'Terms of service and order conditions for WearOMNIA customers.',
    url: CANONICAL_URL,
  },
};

export default function TermsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/policies/terms' },
  ]);

  return (
    <div className="editorial-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="editorial-container max-w-4xl">
        <div className="editorial-header">
          <span className="editorial-kicker">Legal</span>
          <h1 className="editorial-title">Terms of Service</h1>
        </div>
        <div className="editorial-dossier font-sans">
          <p>
            Welcome to WearOMNIA. By browsing or placing an order on our platform, you agree to these terms of service.
          </p>
          <p>
            All garments, embroidery motifs, images, and brand assets are the exclusive intellectual property of WearOMNIA. Prices are quoted in Pakistani Rupees (PKR) and include applicable local taxes.
          </p>
        </div>
      </div>
    </div>
  );
}
