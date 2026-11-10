import React from 'react';
import type { Metadata } from 'next';
import { Truck, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { getPublicSiteSettings } from '@/lib/settings';
import { PRODUCTION_DOMAIN, generateBreadcrumbSchema } from '@/lib/seo';

const CANONICAL_URL = `${PRODUCTION_DOMAIN}/policies/shipping`;

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | WearOMNIA Pakistan',
  description:
    'WearOMNIA nationwide shipping guidelines: 2-4 day delivery timeline across Lahore, Karachi, Islamabad, and 200+ cities with reliable Cash On Delivery.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Shipping & Delivery Policy | WearOMNIA Pakistan',
    description:
      'Nationwide courier dispatch timelines, tracking, and Cash On Delivery terms.',
    url: CANONICAL_URL,
  },
};

export const dynamic = 'force-dynamic';

export default async function ShippingPolicyPage() {
  const settings = await getPublicSiteSettings();
  const freeThresholdStr = settings.freeShippingThreshold > 0
    ? `Rs. ${settings.freeShippingThreshold.toLocaleString()} or above`
    : 'all orders';

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shipping Policy', url: '/policies/shipping' },
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
            Customer Information
          </span>
          <h1 className="editorial-title">Shipping & Delivery Policy</h1>
          <p className="text-xs text-charcoal-muted font-sans">Effective Date: 2026 Season • Nationwide Pakistan Dispatch</p>
        </div>

        <div className="editorial-dossier font-sans">
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <Truck className="w-5 h-5 text-champagne-700" /> 1. Dispatch &amp; Delivery Timelines
            </h2>
            <p>
              All WearOMNIA orders are processed and inspected at our main Lahore location before dispatching. Orders placed with Full Advance Payment are dispatched promptly once payment proof verification is approved.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-charcoal-muted">
              <li><strong>Nationwide Delivery Timeline:</strong> {settings.estimatedDeliveryTime || '2-4 business days'}.</li>
              <li><strong>Major Cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad):</strong> 2 to 3 Business Days.</li>
              <li><strong>Other Cities &amp; Remote Districts:</strong> 3 to 5 Business Days.</li>
              <li>Orders placed on Sundays or Public Holidays will be processed on the next business day.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h2 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-champagne-700" /> 2. Shipping Charges &amp; Free Delivery
            </h2>
            {settings.freeShippingThreshold > 0 ? (
              <>
                <p>
                  We offer <strong>FREE Nationwide Shipping</strong> across Pakistan on all orders with a subtotal of <strong>Rs. {settings.freeShippingThreshold.toLocaleString()} or above</strong>.
                </p>
                <p>
                  For orders below Rs. {settings.freeShippingThreshold.toLocaleString()}, a standard nationwide delivery fee of <strong>Rs. {settings.flatShippingFee}</strong> applies.
                </p>
              </>
            ) : (
              <p>
                We offer <strong>FREE Nationwide Shipping</strong> across Pakistan on <strong>all orders</strong>.
              </p>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h2 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <Clock className="w-5 h-5 text-champagne-700" /> 3. Cash On Delivery (COD) &amp; Parcel Inspection
            </h2>
            <p>
              For COD orders, payment is made to the courier representative prior to opening the sealed outer parcel. For Full Advance orders, no cash is collected upon delivery (COD balance Rs. 0). If you suspect tampering or outer envelope damage, please contact our WhatsApp concierge ({settings.whatsappNumber || '03180633323'}) or email {settings.supportEmail || 'wearomniaa@gmail.com'} immediately before accepting delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
