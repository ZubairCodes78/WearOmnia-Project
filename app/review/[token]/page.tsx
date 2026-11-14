import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { validateReviewToken } from '@/lib/reviews';
import { ReviewSubmitClient } from './ReviewSubmitClient';
import { ArrowLeft, CheckCircle2, ShieldCheck, Star } from 'lucide-react';

interface ReviewPageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  return {
    title: 'Customer Experience Review | WearOMNIA',
    description: 'Share your authentic product review and feedback for your delivered WearOMNIA order.',
    robots: { index: false, follow: false }, // Private per-order customer link
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { token } = await params;
  const validation = await validateReviewToken(token);

  if (!validation.valid || !validation.orderId) {
    return (
      <main className="min-h-[70vh] bg-offwhite flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-sand/60 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Star className="w-8 h-8 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-teal">
              Review Invitation Unavailable
            </h1>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              {validation.error || 'This review link is invalid or has expired.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal text-champagne text-xs font-bold uppercase tracking-wider hover:bg-teal-900 transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Storefront
            </Link>
          </div>

          <div className="pt-4 border-t border-sand/40">
            <p className="text-[11px] text-charcoal-muted">
              Need assistance? Reach our customer care team on WhatsApp at{' '}
              <a href="https://wa.me/923180633323" className="text-teal font-semibold underline">
                03180633323
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ReviewSubmitClient
      token={token}
      orderNumber={validation.orderNumber!}
      customerName={validation.customerName!}
      defaultDisplayName={validation.defaultDisplayName!}
      eligibleItems={validation.eligibleItems!}
    />
  );
}

