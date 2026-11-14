'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, ShieldCheck, ArrowRight, Loader2, MessageSquare, AlertCircle } from 'lucide-react';

interface EligibleReviewItem {
  itemId: string;
  productId: string;
  productTitle: string;
  productSlug: string | null;
  productImage: string;
  variantInfo?: string | null;
  hasReviewed: boolean;
  reviewStatus?: string | null;
  submittedRating?: number | null;
}

interface ReviewSubmitClientProps {
  token: string;
  orderNumber: string;
  customerName: string;
  defaultDisplayName: string;
  eligibleItems: EligibleReviewItem[];
}

export function ReviewSubmitClient({
  token,
  orderNumber,
  customerName,
  defaultDisplayName,
  eligibleItems: initialItems,
}: ReviewSubmitClientProps) {
  const [items, setItems] = useState<EligibleReviewItem[]>(initialItems);
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});

  const allReviewed = items.every((it) => it.hasReviewed);

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 5:
        return 'Exceptional — Loved the fit & fabric!';
      case 4:
        return 'Very Good — High quality tailoring';
      case 3:
        return 'Good — Satisfactory everyday wear';
      case 2:
        return 'Fair — Room for improvement';
      case 1:
        return 'Poor — Did not meet expectations';
      default:
        return 'Select a star rating';
    }
  };

  const handleRatingClick = (productId: string, rating: number) => {
    setSelectedRatings((prev) => ({ ...prev, [productId]: rating }));
    setErrors((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleSubmit = async (productId: string) => {
    const rating = selectedRatings[productId];
    const comment = comments[productId] || '';
    const name = displayNames[productId] !== undefined ? displayNames[productId] : defaultDisplayName;

    if (!rating) {
      setErrors((prev) => ({ ...prev, [productId]: 'Please tap a star rating (1 to 5) before submitting.' }));
      return;
    }

    if (comment.trim().length < 5) {
      setErrors((prev) => ({ ...prev, [productId]: 'Please share a few words about your experience (at least 5 characters).' }));
      return;
    }

    setSubmittingProductId(productId);
    setErrors((prev) => ({ ...prev, [productId]: '' }));

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          productId,
          rating,
          comment: comment.trim(),
          displayName: name.trim() || defaultDisplayName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors((prev) => ({ ...prev, [productId]: data.error || 'Submission failed. Please try again.' }));
        return;
      }

      setSuccessMessages((prev) => ({
        ...prev,
        [productId]: 'Your review has been submitted for moderation. Thank you for helping other modest wear seekers!',
      }));

      // Update item to reviewed in local state
      setItems((prev) =>
        prev.map((it) =>
          it.productId === productId
            ? { ...it, hasReviewed: true, submittedRating: rating, reviewStatus: 'PENDING' }
            : it
        )
      );
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [productId]: 'Network error. Please check your connection and retry.' }));
    } finally {
      setSubmittingProductId(null);
    }
  };

  return (
    <main className="min-h-screen bg-offwhite py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne-100 text-teal border border-champagne/40 text-[11px] font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-champagne-700" /> Verified Customer Feedback
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-teal tracking-tight">
            How Did Your Order Fit?
          </h1>
          <p className="text-sm text-charcoal-muted max-w-lg mx-auto">
            Assalam-o-Alaikum <span className="font-semibold text-teal">{customerName}</span>. Thank you for choosing WearOMNIA for Order{' '}
            <span className="font-mono font-semibold text-teal">#{orderNumber}</span>. Your authentic feedback helps us refine our modest silhouettes.
          </p>
        </div>

        {/* All Completed Notice */}
        {allReviewed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-teal text-offwhite border border-champagne/40 shadow-lg text-center space-y-3"
          >
            <CheckCircle2 className="w-10 h-10 text-champagne mx-auto" />
            <h2 className="font-serif text-xl font-bold">All Items Reviewed!</h2>
            <p className="text-xs sm:text-sm text-offwhite/80 max-w-md mx-auto">
              You have submitted feedback for every garment in this order. Our moderation team reviews all entries before publishing them live.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-champagne text-teal text-xs font-bold uppercase tracking-wider hover:bg-champagne-300 transition-all shadow-md"
              >
                Browse New Arrivals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Product Review Cards */}
        <div className="space-y-8">
          {items.map((item, idx) => {
            const currentRating = selectedRatings[item.productId] || 0;
            const activeHover = hoverRatings[item.productId] || 0;
            const effectiveRating = activeHover || currentRating;
            const isSubmitting = submittingProductId === item.productId;
            const itemError = errors[item.productId];
            const itemSuccess = successMessages[item.productId];

            return (
              <div
                key={item.itemId || item.productId}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-sand/70 shadow-md space-y-6 transition-all"
              >
                {/* Product Summary Row */}
                <div className="flex items-center gap-4 sm:gap-6 border-b border-sand/40 pb-5">
                  <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-sand/30 shrink-0 border border-sand">
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      fill
                      className="object-cover object-center"
                      sizes="96px"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-champagne-700 block">
                      Purchased Item #{idx + 1}
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-teal line-clamp-1">
                      {item.productTitle}
                    </h3>
                    {item.variantInfo && (
                      <p className="text-xs text-charcoal-muted">
                        Variant: <span className="font-medium text-teal">{item.variantInfo}</span>
                      </p>
                    )}
                    {item.productSlug && (
                      <Link
                        href={`/product/${item.productSlug}`}
                        target="_blank"
                        className="text-[11px] text-teal underline font-medium hover:text-champagne-700 transition-colors inline-block pt-0.5"
                      >
                        View Product Details &rarr;
                      </Link>
                    )}
                  </div>
                </div>

                {/* Form or Already Reviewed State */}
                {item.hasReviewed ? (
                  <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-emerald-900">
                        Review Submitted for this Garment
                      </p>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        {itemSuccess ||
                          'Thank you! Your verified feedback is currently under moderation and will be published once verified.'}
                      </p>
                      {item.submittedRating && (
                        <div className="flex items-center gap-1 pt-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= item.submittedRating!
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-semibold text-emerald-900 ml-1.5">
                            {item.submittedRating} of 5 Stars
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pt-1">
                    {/* 1. Star Rating Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-teal block">
                        Overall Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isFilled = starValue <= effectiveRating;
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onClick={() => handleRatingClick(item.productId, starValue)}
                              onMouseEnter={() =>
                                setHoverRatings((prev) => ({ ...prev, [item.productId]: starValue }))
                              }
                              onMouseLeave={() =>
                                setHoverRatings((prev) => ({ ...prev, [item.productId]: 0 }))
                              }
                              aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                              className="p-1 sm:p-1.5 rounded-lg hover:bg-sand/40 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-champagne"
                            >
                              <Star
                                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                  isFilled
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                    : 'text-gray-300 hover:text-amber-200'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="text-xs font-medium text-charcoal-muted ml-2">
                          {getRatingLabel(effectiveRating)}
                        </span>
                      </div>
                    </div>

                    {/* 2. Review Text Area */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`comment-${item.productId}`}
                          className="text-xs font-bold uppercase tracking-wider text-teal"
                        >
                          Your Experience &amp; Fit Feedback <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-charcoal-muted">
                          {(comments[item.productId] || '').length}/1500 chars
                        </span>
                      </div>
                      <textarea
                        id={`comment-${item.productId}`}
                        rows={4}
                        value={comments[item.productId] || ''}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 1500);
                          setComments((prev) => ({ ...prev, [item.productId]: val }));
                          setErrors((prev) => ({ ...prev, [item.productId]: '' }));
                        }}
                        placeholder="Tell us about the fabric texture, sleeve and shoulder fit, stitching quality, or how comfortable it felt throughout the day..."
                        className="w-full p-3.5 text-xs sm:text-sm text-charcoal bg-sand/20 rounded-xl border border-sand/70 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all shadow-inner placeholder:text-charcoal-muted/60"
                      />
                    </div>

                    {/* 3. Display Name (Privacy Conscious) */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`name-${item.productId}`}
                        className="text-xs font-bold uppercase tracking-wider text-teal block"
                      >
                        Public Display Name
                      </label>
                      <input
                        id={`name-${item.productId}`}
                        type="text"
                        maxLength={50}
                        value={
                          displayNames[item.productId] !== undefined
                            ? displayNames[item.productId]
                            : defaultDisplayName
                        }
                        onChange={(e) =>
                          setDisplayNames((prev) => ({ ...prev, [item.productId]: e.target.value }))
                        }
                        placeholder={defaultDisplayName}
                        className="w-full sm:w-80 p-2.5 text-xs text-charcoal bg-sand/20 rounded-xl border border-sand/70 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white"
                      />
                      <p className="text-[10px] text-charcoal-muted flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-champagne-700" />
                        To protect your privacy, we default your surname to an initial (e.g., {defaultDisplayName}).
                      </p>
                    </div>

                    {/* Error Notice */}
                    {itemError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{itemError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(item.productId)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal text-champagne text-xs font-bold uppercase tracking-wider hover:bg-teal-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-champagne" /> Submitting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" /> Submit Verified Review
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

