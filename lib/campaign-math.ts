/**
 * WearOMNIA Pure Seasonal Campaign Math & Eligibility Engine
 *
 * Client-and-Server Safe (Zero DB / Node-only imports).
 * Reuses `lib/pricing.ts` for baseline selling prices and discount percentage calculation.
 * Never duplicates pricing math across frontend and backend.
 */

import {
  getEffectiveSellingPrice,
  calculateDiscountPercent,
} from '@/lib/pricing';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CampaignScopeType =
  | 'STOREWIDE'
  | 'COLLECTIONS'
  | 'CATEGORIES'
  | 'SELECTED_PRODUCTS';

export type CouponStackingMode =
  | 'BLOCK_COUPONS'
  | 'ALLOW_COUPONS'
  | 'BEST_DISCOUNT_ONLY';

export type CampaignDiscountType = 'PERCENTAGE' | 'FIXED';

export interface PublicCampaignSummary {
  id: string;
  name: string;
  slug: string;
  publicTitle: string;
  badgeText: string | null;
  status: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  timezone: string;
  priority: number;
  scopeType: string;
  includedProductIds: string[];
  excludedProductIds: string[];
  includedCollectionIds: string[];
  includedCategoryIds: string[];
  allowPreOrderProducts: boolean;
  couponStackingMode: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  desktopBannerUrl: string | null;
  mobileBannerUrl: string | null;
  showBanner: boolean;
  replaceHeroSlider: boolean;
  announcementEnabled: boolean;
  announcementText: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  showCountdown: boolean;
  landingPageEnabled: boolean;
  landingPageDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt?: string | Date;
}

export interface CampaignPhaseEvaluation {
  effectiveStatus: CampaignStatus;
  isLive: boolean;
  label: string;
  startsInMs: number | null;
  endsInMs: number | null;
}

export interface ProductLikeForCampaign {
  id: string;
  basePrice: number | string;
  discountPrice?: number | string | null;
  categoryId?: string | null;
  collectionId?: string | null;
  isPreOrder?: boolean;
}

export interface AppliedCampaignMeta {
  id: string;
  name: string;
  slug: string;
  publicTitle: string;
  badgeText: string;
  discountType: string;
  discountValue: number;
  couponStackingMode: CouponStackingMode;
  endDate: string | null;
}

export interface ProductCampaignPricingResult {
  originalPrice: number;
  staticSellingPrice: number;
  effectiveSellingPrice: number;
  totalDiscountAmount: number;
  campaignDiscountAmount: number;
  discountPercent: number;
  hasDiscount: boolean;
  hasCampaignDiscount: boolean;
  appliedCampaign: AppliedCampaignMeta | null;
}

/**
 * Evaluates a campaign's live effective phase against server time `now`.
 * - DRAFT / PAUSED / COMPLETED / CANCELLED are never live.
 * - SCHEDULED / ACTIVE automatically become live once now >= startDate
 *   and automatically expire once now > endDate.
 */
export function getEffectiveCampaignPhase(
  campaign: {
    status: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  },
  now: Date = new Date()
): CampaignPhaseEvaluation {
  const rawStatus = (campaign.status || 'DRAFT').toUpperCase() as CampaignStatus;
  const nowMs = now.getTime();
  const startMs = campaign.startDate ? new Date(campaign.startDate).getTime() : null;
  const endMs = campaign.endDate ? new Date(campaign.endDate).getTime() : null;

  if (rawStatus === 'DRAFT') {
    return { effectiveStatus: 'DRAFT', isLive: false, label: 'Draft', startsInMs: null, endsInMs: null };
  }
  if (rawStatus === 'PAUSED') {
    return { effectiveStatus: 'PAUSED', isLive: false, label: 'Paused', startsInMs: null, endsInMs: null };
  }
  if (rawStatus === 'CANCELLED') {
    return { effectiveStatus: 'CANCELLED', isLive: false, label: 'Cancelled', startsInMs: null, endsInMs: null };
  }
  if (rawStatus === 'COMPLETED') {
    return { effectiveStatus: 'COMPLETED', isLive: false, label: 'Completed', startsInMs: null, endsInMs: null };
  }

  // Status is SCHEDULED or ACTIVE -> evaluate server clock window strictly
  if (startMs !== null && !isNaN(startMs) && nowMs < startMs) {
    return {
      effectiveStatus: 'SCHEDULED',
      isLive: false,
      label: 'Scheduled',
      startsInMs: startMs - nowMs,
      endsInMs: endMs !== null && !isNaN(endMs) ? Math.max(0, endMs - nowMs) : null,
    };
  }

  if (endMs !== null && !isNaN(endMs) && nowMs > endMs) {
    return {
      effectiveStatus: 'COMPLETED',
      isLive: false,
      label: 'Expired',
      startsInMs: 0,
      endsInMs: 0,
    };
  }

  return {
    effectiveStatus: 'ACTIVE',
    isLive: true,
    label: 'Active',
    startsInMs: 0,
    endsInMs: endMs !== null && !isNaN(endMs) ? Math.max(0, endMs - nowMs) : null,
  };
}

/**
 * Checks whether a specific product is eligible for a given campaign.
 */
export function isProductEligibleForCampaign(
  product: ProductLikeForCampaign,
  campaign: Pick<
    PublicCampaignSummary,
    | 'scopeType'
    | 'includedProductIds'
    | 'excludedProductIds'
    | 'includedCollectionIds'
    | 'includedCategoryIds'
    | 'allowPreOrderProducts'
  >
): boolean {
  if (!product || !campaign) return false;

  // 1. Pre-order eligibility check: never silently include pre-orders
  if (product.isPreOrder && !campaign.allowPreOrderProducts) {
    return false;
  }

  // 2. Explicit exclusions override any scope
  if (
    Array.isArray(campaign.excludedProductIds) &&
    campaign.excludedProductIds.includes(product.id)
  ) {
    return false;
  }

  // 3. Scope check
  const scope = (campaign.scopeType || 'SELECTED_PRODUCTS').toUpperCase();
  if (scope === 'STOREWIDE') {
    return true;
  }

  if (scope === 'COLLECTIONS') {
    return Boolean(
      product.collectionId &&
        Array.isArray(campaign.includedCollectionIds) &&
        campaign.includedCollectionIds.includes(product.collectionId)
    );
  }

  if (scope === 'CATEGORIES') {
    return Boolean(
      product.categoryId &&
        Array.isArray(campaign.includedCategoryIds) &&
        campaign.includedCategoryIds.includes(product.categoryId)
    );
  }

  // SELECTED_PRODUCTS
  return Boolean(
    Array.isArray(campaign.includedProductIds) &&
      campaign.includedProductIds.includes(product.id)
  );
}

/**
 * Calculates per-unit campaign discount against base retail price.
 * Never produces a negative selling price.
 * Never double-discounts on top of product.discountPrice.
 */
export function calculateCampaignUnitDiscount(
  basePriceInput: number | string,
  campaign: Pick<PublicCampaignSummary, 'discountType' | 'discountValue' | 'maxDiscountAmount'>
): { discountedPrice: number; discountOffBase: number } {
  const basePrice = Math.max(
    0,
    typeof basePriceInput === 'number' ? basePriceInput : parseFloat(String(basePriceInput)) || 0
  );

  if (basePrice <= 0) {
    return { discountedPrice: 0, discountOffBase: 0 };
  }

  const rawValue = Math.max(0, Number(campaign.discountValue) || 0);
  if (rawValue <= 0) {
    return { discountedPrice: basePrice, discountOffBase: 0 };
  }

  let rawDiscount = 0;
  if ((campaign.discountType || '').toUpperCase() === 'PERCENTAGE') {
    const safePct = Math.min(95, rawValue);
    rawDiscount = (basePrice * safePct) / 100;
  } else {
    rawDiscount = rawValue;
  }

  if (
    campaign.maxDiscountAmount !== null &&
    campaign.maxDiscountAmount !== undefined &&
    Number(campaign.maxDiscountAmount) > 0
  ) {
    rawDiscount = Math.min(rawDiscount, Number(campaign.maxDiscountAmount));
  }

  const clampedDiscount = Math.min(basePrice, Math.max(0, Math.round(rawDiscount)));
  const discountedPrice = Math.max(0, Math.round(basePrice - clampedDiscount));

  return {
    discountedPrice,
    discountOffBase: Math.max(0, basePrice - discountedPrice),
  };
}

/**
 * Resolves the authoritative unit pricing for a single product across all currently LIVE campaigns.
 * Deterministic conflict resolution when campaigns overlap:
 *   1. Highest `priority` wins.
 *   2. Tie-breaker: Lowest resulting `discountedPrice` (best saving for customer).
 *   3. Tie-breaker: Most recently updated campaign.
 *
 * Guarantees:
 * - Never stacks two campaigns on one item.
 * - Never stacks campaign discount on top of static `discountPrice`.
 * - Never raises a price above static `discountPrice`.
 */
export function resolveProductCampaignPricing(
  product: ProductLikeForCampaign,
  liveCampaigns: PublicCampaignSummary[]
): ProductCampaignPricingResult {
  const originalPrice = Math.max(
    0,
    typeof product.basePrice === 'number'
      ? product.basePrice
      : parseFloat(String(product.basePrice)) || 0
  );
  const staticSellingPrice = getEffectiveSellingPrice(product);

  if (!liveCampaigns || liveCampaigns.length === 0 || originalPrice <= 0) {
    const totalDiscount = Math.max(0, originalPrice - staticSellingPrice);
    return {
      originalPrice,
      staticSellingPrice,
      effectiveSellingPrice: staticSellingPrice,
      totalDiscountAmount: totalDiscount,
      campaignDiscountAmount: 0,
      discountPercent: calculateDiscountPercent(originalPrice, staticSellingPrice),
      hasDiscount: totalDiscount > 0,
      hasCampaignDiscount: false,
      appliedCampaign: null,
    };
  }

  const eligibleCandidates = liveCampaigns
    .filter((c) => isProductEligibleForCampaign(product, c))
    .map((c) => {
      const calc = calculateCampaignUnitDiscount(originalPrice, c);
      return { campaign: c, ...calc };
    })
    .filter((entry) => entry.discountOffBase > 0);

  if (eligibleCandidates.length === 0) {
    const totalDiscount = Math.max(0, originalPrice - staticSellingPrice);
    return {
      originalPrice,
      staticSellingPrice,
      effectiveSellingPrice: staticSellingPrice,
      totalDiscountAmount: totalDiscount,
      campaignDiscountAmount: 0,
      discountPercent: calculateDiscountPercent(originalPrice, staticSellingPrice),
      hasDiscount: totalDiscount > 0,
      hasCampaignDiscount: false,
      appliedCampaign: null,
    };
  }

  eligibleCandidates.sort((a, b) => {
    if ((b.campaign.priority || 0) !== (a.campaign.priority || 0)) {
      return (b.campaign.priority || 0) - (a.campaign.priority || 0);
    }
    if (a.discountedPrice !== b.discountedPrice) {
      return a.discountedPrice - b.discountedPrice;
    }
    const aUpdated = a.campaign.updatedAt ? new Date(a.campaign.updatedAt).getTime() : 0;
    const bUpdated = b.campaign.updatedAt ? new Date(b.campaign.updatedAt).getTime() : 0;
    return bUpdated - aUpdated;
  });

  const winner = eligibleCandidates[0];

  // Never double-discount or raise price over a deeper static discountPrice
  if (winner.discountedPrice > staticSellingPrice) {
    const totalDiscount = Math.max(0, originalPrice - staticSellingPrice);
    return {
      originalPrice,
      staticSellingPrice,
      effectiveSellingPrice: staticSellingPrice,
      totalDiscountAmount: totalDiscount,
      campaignDiscountAmount: 0,
      discountPercent: calculateDiscountPercent(originalPrice, staticSellingPrice),
      hasDiscount: totalDiscount > 0,
      hasCampaignDiscount: false,
      appliedCampaign: null,
    };
  }

  const effectiveSellingPrice = Math.max(0, winner.discountedPrice);
  const campaignDiscountAmount = Math.max(0, staticSellingPrice - effectiveSellingPrice);
  const totalDiscountAmount = Math.max(0, originalPrice - effectiveSellingPrice);
  const endDateIso = winner.campaign.endDate
    ? new Date(winner.campaign.endDate).toISOString()
    : null;

  return {
    originalPrice,
    staticSellingPrice,
    effectiveSellingPrice,
    totalDiscountAmount,
    campaignDiscountAmount,
    discountPercent: calculateDiscountPercent(originalPrice, effectiveSellingPrice),
    hasDiscount: totalDiscountAmount > 0,
    hasCampaignDiscount: true,
    appliedCampaign: {
      id: winner.campaign.id,
      name: winner.campaign.name,
      slug: winner.campaign.slug,
      publicTitle: winner.campaign.publicTitle,
      badgeText: winner.campaign.badgeText || 'SALE',
      discountType: winner.campaign.discountType,
      discountValue: winner.campaign.discountValue,
      couponStackingMode: (winner.campaign.couponStackingMode || 'BLOCK_COUPONS') as CouponStackingMode,
      endDate: endDateIso,
    },
  };
}

