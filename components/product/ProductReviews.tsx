'use client';

import React from 'react';
import { Star, ShieldCheck, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ProductReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  createdAt: string | Date;
}

interface ProductReviewsProps {
  productTitle: string;
  reviews?: ProductReviewItem[];
}

export function ProductReviews({ productTitle, reviews = [] }: ProductReviewsProps) {
  const approvedReviews = Array.isArray(reviews) ? reviews : [];
  const reviewCount = approvedReviews.length;

  const averageRating =
    reviewCount > 0
      ? (approvedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewCount).toFixed(1)
      : '0.0';

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = approvedReviews.filter((r) => r.rating === stars).length;
    const percent = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { stars, count, percent };
  });

  return (
    <section
      id="reviews"
      aria-label="Customer Reviews"
      className="border-t border-sand/60 pt-12 sm:pt-16 mt-12 sm:mt-16"
    >
      <div className="space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand/40 pb-6">
          <div className="space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              Verified Feedback
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-teal tracking-tight">
              Customer Impressions
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md">
              Honest testimonials from customers who purchased and wore {productTitle}.
            </p>
          </div>

          {reviewCount > 0 && (
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-sand shadow-sm self-start md:self-auto">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(Number(averageRating))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-teal">{averageRating}</span>
              <span className="text-xs text-charcoal-muted">
                ({reviewCount} verified {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        {/* Content: Reviews List or Empty State */}
        {reviewCount === 0 ? (
          <div className="bg-white/80 rounded-3xl p-8 sm:p-12 border border-sand/60 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-champagne-100/70 border border-champagne/40 text-teal flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-champagne-700" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-teal">
                No Reviews Yet
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Be among the first to experience this silhouette. To preserve total authenticity, WearOMNIA collects reviews strictly via verified WhatsApp invitations sent after parcel delivery.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-teal-800">
              <ShieldCheck className="w-4 h-4 text-champagne-700" /> 100% Authentic Verified Buyer Policy
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Rating Breakdown Sidebar */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-sand shadow-sm space-y-6">
              <div className="text-center space-y-1.5 pb-4 border-b border-sand/40">
                <span className="font-serif text-4xl sm:text-5xl font-black text-teal">
                  {averageRating}
                </span>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(Number(averageRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-charcoal-muted">
                  Based on {reviewCount} verified {reviewCount === 1 ? 'buyer' : 'buyers'}
                </p>
              </div>

              {/* Star Distribution Bars */}
              <div className="space-y-2.5">
                {distribution.map(({ stars, count, percent }) => (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-10 font-bold text-teal flex items-center gap-1">
                      {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-sand/40 overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-charcoal-muted font-medium text-[11px]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-sand/40 text-center">
                <p className="text-[11px] text-charcoal-muted flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-champagne-700" /> Verified purchase protection
                </p>
              </div>
            </div>

            {/* Reviews Cards List */}
            <div className="lg:col-span-8 space-y-4">
              {approvedReviews.map((rev) => {
                const dateStr = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-sand/70 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm sm:text-base text-teal">
                            {rev.customerName}
                          </span>
                          {rev.verifiedPurchase !== false && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold tracking-wider uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                            </span>
                          )}
                        </div>
                        {dateStr && (
                          <span className="text-[11px] text-charcoal-muted block">
                            Reviewed on {dateStr}
                          </span>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-charcoal leading-relaxed whitespace-pre-line pt-1">
                      {rev.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

