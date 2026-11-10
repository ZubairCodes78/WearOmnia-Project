import React from 'react';
import type { Metadata } from 'next';
import { Banknote, ShieldCheck } from 'lucide-react';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema } from '@/lib/seo';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/policies/refund`;

export const metadata: Metadata = {
  title: 'Refund & Financial Guidelines | WearOMNIA Cash On Delivery',
  description:
    'Information on WearOMNIA refund processing for Cash On Delivery orders via online bank transfer, EasyPaisa, or JazzCash.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Refund & Financial Guidelines | WearOMNIA',
    description: 'Clear, transparent Cash On Delivery terms and refund guidelines.',
    url: CANONICAL_URL,
  },
};

export default function RefundPolicyPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Refund Policy', url: '/policies/refund' },
  ]);

  return (
    <div className="editorial-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="editorial-container max-w-4xl">
        <div className="editorial-header">
          <span className="editorial-kicker">
            Terms & Assurance
          </span>
          <h1 className="editorial-title">Refund & Financial Guidelines</h1>
          <p className="text-xs text-charcoal-muted font-sans">Clear, Transparent Cash On Delivery Terms</p>
        </div>

        <div className="editorial-dossier font-sans">
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <Banknote className="w-5 h-5 text-champagne-700" /> 1. Cash On Delivery &amp; Advance Payment Refunds
            </h2>
            <p>
              Eligible refunds for defective items or orders cancelled prior to dispatch (across both Cash On Delivery and verified Full Advance / Pre-Order advance payments) are processed via bank transfer, EasyPaisa, or JazzCash to the customer&apos;s verified account within 3 to 5 business days based on the actual charged amount.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h2 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-champagne-700" /> 2. Store Credit &amp; Replacements
            </h2>
            <p>
              Alternatively, customers may opt for store credit coupons or size replacements of equal value for immediate use on WearOMNIA collections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
