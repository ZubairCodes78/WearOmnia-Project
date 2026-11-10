import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/settings';
import { validateCouponServer } from '@/lib/coupons';
import {
  PublicCampaignSummary,
  ProductLikeForCampaign,
  ProductCampaignPricingResult,
  CouponStackingMode,
  AppliedCampaignMeta,
  getEffectiveCampaignPhase,
  resolveProductCampaignPricing,
  isProductEligibleForCampaign,
} from '@/lib/campaign-math';

export * from '@/lib/campaign-math';

/**
 * Strips internal admin-only fields (notes, preview token, creator emails)
 * before serializing a campaign to public storefront surfaces.
 */
export function toPublicCampaign(c: any): PublicCampaignSummary {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    publicTitle: c.publicTitle,
    badgeText: c.badgeText || 'SALE',
    status: c.status,
    startDate: c.startDate ? new Date(c.startDate).toISOString() : null,
    endDate: c.endDate ? new Date(c.endDate).toISOString() : null,
    timezone: c.timezone || 'Asia/Karachi',
    priority: typeof c.priority === 'number' ? c.priority : 10,
    scopeType: c.scopeType || 'SELECTED_PRODUCTS',
    includedProductIds: Array.isArray(c.includedProductIds) ? c.includedProductIds : [],
    excludedProductIds: Array.isArray(c.excludedProductIds) ? c.excludedProductIds : [],
    includedCollectionIds: Array.isArray(c.includedCollectionIds) ? c.includedCollectionIds : [],
    includedCategoryIds: Array.isArray(c.includedCategoryIds) ? c.includedCategoryIds : [],
    allowPreOrderProducts: Boolean(c.allowPreOrderProducts),
    couponStackingMode: c.couponStackingMode || 'BLOCK_COUPONS',
    discountType: c.discountType || 'PERCENTAGE',
    discountValue: Number(c.discountValue) || 0,
    maxDiscountAmount: c.maxDiscountAmount !== null && c.maxDiscountAmount !== undefined ? Number(c.maxDiscountAmount) : null,
    bannerTitle: c.bannerTitle || null,
    bannerSubtitle: c.bannerSubtitle || null,
    desktopBannerUrl: c.desktopBannerUrl || null,
    mobileBannerUrl: c.mobileBannerUrl || null,
    showBanner: c.showBanner !== false,
    replaceHeroSlider: Boolean(c.replaceHeroSlider),
    announcementEnabled: Boolean(c.announcementEnabled),
    announcementText: c.announcementText || null,
    ctaText: c.ctaText || 'Shop Sale',
    ctaLink: c.ctaLink || null,
    showCountdown: c.showCountdown !== false,
    landingPageEnabled: c.landingPageEnabled !== false,
    landingPageDescription: c.landingPageDescription || null,
    seoTitle: c.seoTitle || null,
    seoDescription: c.seoDescription || null,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
  };
}

/**
 * Cached reader of potentially active/scheduled campaigns.
 * Evaluated at runtime against live server `new Date()`, so campaigns activate
 * and expire at exact server timestamps without waiting for ISR rebuilds.
 */
export const getCandidateCampaignsCached = unstable_cache(
  async (): Promise<PublicCampaignSummary[]> => {
    try {
      const rows = await prisma.campaign.findMany({
        where: {
          status: { in: ['ACTIVE', 'SCHEDULED'] },
        },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      });
      return rows.map(toPublicCampaign);
    } catch (err) {
      console.error('Failed to read candidate campaigns:', err);
      return [];
    }
  },
  ['candidate-campaigns'],
  { tags: ['campaigns'], revalidate: 30 }
);

/**
 * Direct uncached DB query for strictly live checkout verification & mutations.
 */
export async function getLiveCampaignsFresh(now: Date = new Date()): Promise<PublicCampaignSummary[]> {
  try {
    const rows = await prisma.campaign.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
    return rows
      .map(toPublicCampaign)
      .filter((c) => getEffectiveCampaignPhase(c, now).isLive);
  } catch (err) {
    console.error('Failed to read live campaigns from DB:', err);
    return [];
  }
}

/**
 * Returns currently LIVE campaigns using Data Cache + exact server-clock filtering.
 */
export async function getLiveCampaigns(now: Date = new Date()): Promise<PublicCampaignSummary[]> {
  const candidates = await getCandidateCampaignsCached();
  return candidates.filter((c) => getEffectiveCampaignPhase(c, now).isLive);
}

/**
 * Revalidates all storefront & landing caches immediately after any Admin campaign change.
 */
export function revalidateCampaignCaches(slugs: string[] = []) {
  try {
    revalidateTag('campaigns');
    revalidateTag('site-settings');
    revalidatePath('/', 'layout');
    revalidatePath('/shop');
    revalidatePath('/checkout');
    revalidatePath('/sitemap.xml');
    for (const s of slugs) {
      if (s) revalidatePath(`/sale/${s}`);
    }
  } catch (e) {
    // Graceful no-op outside Next request context (e.g. CLI test scripts)
  }
}

/**
 * Enriches an array of product objects with active seasonal campaign pricing metadata.
 */
export function applyCampaignsToProducts<T extends ProductLikeForCampaign>(
  products: T[],
  liveCampaigns: PublicCampaignSummary[]
): Array<
  T & {
    campaignPricing: ProductCampaignPricingResult;
  }
> {
  return products.map((product) => {
    const campaignPricing = resolveProductCampaignPricing(product, liveCampaigns);
    return {
      ...product,
      campaignPricing,
    };
  });
}

/**
 * Filters a product catalog down to only products eligible for a given campaign.
 */
export function filterProductsForCampaign<T extends ProductLikeForCampaign>(
  products: T[],
  campaign: PublicCampaignSummary
): T[] {
  return products.filter((p) => isProductEligibleForCampaign(p, campaign));
}

export interface ServerCartItemInput {
  productId?: string;
  title?: string;
  size?: string;
  color?: string;
  sku?: string;
  quantity: number;
  price?: number;
}

export interface EvaluatedCartLineItem {
  productId: string | null;
  productTitle: string;
  variantInfo: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  isPreOrder: boolean;
  originalPrice: number;
  staticSellingPrice: number;
  unitPrice: number;
  subtotal: number;
  campaignId: string | null;
  campaignName: string | null;
  campaignSlug: string | null;
  campaignDiscountPerUnit: number;
  totalCampaignDiscount: number;
  discountPercent: number;
  appliedCampaign: AppliedCampaignMeta | null;
}

export interface ServerCartQuoteResult {
  items: EvaluatedCartLineItem[];
  originalRetailSubtotal: number;
  staticSubtotal: number;
  subtotal: number; // Post-campaign merchandise subtotal (charged merchandise amount before coupon)
  campaignDiscountAmount: number;
  couponCode: string | null;
  couponValid: boolean;
  couponDiscountAmount: number;
  couponError: string | null;
  stackingResolution: 'NONE' | 'CAMPAIGN_ONLY' | 'COUPON_WINS' | 'CAMPAIGN_WINS' | 'STACKED';
  stackingMessage: string | null;
  shippingFee: number;
  codCharges: number;
  totalAmount: number;
  primaryCampaignId: string | null;
  primaryCampaignName: string | null;
  primaryCampaignSlug: string | null;
  campaignIds: string[];
  activeCampaignCount: number;
  serverTimeMs: number;
}

/**
 * Canonical Server-Authoritative Cart & Checkout Quote Calculator.
 * Used by:
 *   - POST /api/orders (Regular COD & 100% Full Advance)
 *   - POST /api/preorder/checkout (Pre-Orders)
 *   - POST /api/checkout/price-check (Checkout live price sync)
 *   - POST /api/coupons/validate (Stacking-aware coupon validation)
 */
export async function calculateServerCartQuote(params: {
  items: ServerCartItemInput[];
  couponCode?: string | null;
  isPreOrderOrder?: boolean;
  city?: string;
  paymentMethod?: string;
  now?: Date;
}): Promise<ServerCartQuoteResult> {
  const now = params.now || new Date();
  const isPreOrderOrder = Boolean(params.isPreOrderOrder);
  const itemsInput = Array.isArray(params.items) ? params.items : [];

  const productIds = Array.from(
    new Set(itemsInput.map((i) => i.productId).filter((id): id is string => Boolean(id)))
  );

  const [dbProducts, liveCampaigns, siteSettings] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            title: true,
            sku: true,
            basePrice: true,
            discountPrice: true,
            categoryId: true,
            collectionId: true,
            isPreOrder: true,
            stockQuantity: true,
            preOrderAdvancePercent: true,
          },
        })
      : Promise.resolve([]),
    getLiveCampaignsFresh(now),
    getSiteSettings(),
  ]);

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  let originalRetailSubtotal = 0;
  let staticSubtotal = 0;
  let campaignSubtotal = 0;
  let totalCampaignDiscount = 0;

  let evaluatedItems: EvaluatedCartLineItem[] = itemsInput.map((item) => {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const prod = item.productId ? productMap.get(item.productId) : undefined;

    const productLike: ProductLikeForCampaign = prod
      ? prod
      : {
          id: item.productId || 'custom',
          basePrice: Math.max(0, Number(item.price) || 0),
          discountPrice: null,
          isPreOrder: isPreOrderOrder,
        };

    const pricing = resolveProductCampaignPricing(productLike, liveCampaigns);
    const lineSubtotal = pricing.effectiveSellingPrice * qty;
    const lineCampaignDiscount = pricing.campaignDiscountAmount * qty;

    originalRetailSubtotal += pricing.originalPrice * qty;
    staticSubtotal += pricing.staticSellingPrice * qty;
    campaignSubtotal += lineSubtotal;
    totalCampaignDiscount += lineCampaignDiscount;

    return {
      productId: prod?.id || item.productId || null,
      productTitle: prod?.title || item.title || 'Product',
      variantInfo:
        item.size || item.color
          ? `Size: ${item.size || 'Standard'}, Color: ${item.color || 'Standard'}`
          : 'Standard',
      sku: prod?.sku || item.sku || '',
      size: item.size || 'Standard',
      color: item.color || 'Standard',
      quantity: qty,
      isPreOrder: Boolean(prod?.isPreOrder),
      originalPrice: pricing.originalPrice,
      staticSellingPrice: pricing.staticSellingPrice,
      unitPrice: pricing.effectiveSellingPrice,
      subtotal: lineSubtotal,
      campaignId: pricing.appliedCampaign?.id || null,
      campaignName: pricing.appliedCampaign?.name || null,
      campaignSlug: pricing.appliedCampaign?.slug || null,
      campaignDiscountPerUnit: pricing.campaignDiscountAmount,
      totalCampaignDiscount: lineCampaignDiscount,
      discountPercent: pricing.discountPercent,
      appliedCampaign: pricing.appliedCampaign,
    };
  });

  // Determine governing coupon stacking rule among applied campaigns
  const appliedCampaignsList = evaluatedItems
    .map((i) => i.appliedCampaign)
    .filter((c): c is AppliedCampaignMeta => Boolean(c));

  let governingStackingMode: CouponStackingMode = 'ALLOW_COUPONS';
  if (appliedCampaignsList.length > 0 && totalCampaignDiscount > 0) {
    const modes = new Set(appliedCampaignsList.map((c) => c.couponStackingMode));
    if (modes.has('BLOCK_COUPONS')) {
      governingStackingMode = 'BLOCK_COUPONS';
    } else if (modes.has('BEST_DISCOUNT_ONLY')) {
      governingStackingMode = 'BEST_DISCOUNT_ONLY';
    } else {
      governingStackingMode = 'ALLOW_COUPONS';
    }
  }

  let finalSubtotal = campaignSubtotal;
  let finalCampaignDiscount = totalCampaignDiscount;
  let finalCouponCode: string | null = params.couponCode ? params.couponCode.trim().toUpperCase() : null;
  let couponValid = false;
  let couponDiscountAmount = 0;
  let couponError: string | null = null;
  let stackingResolution: ServerCartQuoteResult['stackingResolution'] =
    finalCampaignDiscount > 0 ? 'CAMPAIGN_ONLY' : 'NONE';
  let stackingMessage: string | null = null;

  if (finalCouponCode) {
    if (appliedCampaignsList.length > 0 && finalCampaignDiscount > 0) {
      if (governingStackingMode === 'BLOCK_COUPONS') {
        couponValid = false;
        couponDiscountAmount = 0;
        couponError = 'Promo codes cannot be stacked with active seasonal campaign discounts.';
        stackingResolution = 'CAMPAIGN_ONLY';
        stackingMessage = couponError;
        finalCouponCode = null;
      } else if (governingStackingMode === 'BEST_DISCOUNT_ONLY') {
        const couponCheck = await validateCouponServer({
          code: finalCouponCode,
          subtotal: staticSubtotal,
          isPreOrder: isPreOrderOrder,
          now,
        });

        if (!couponCheck.valid) {
          couponValid = false;
          couponDiscountAmount = 0;
          couponError = couponCheck.error || 'Invalid coupon code.';
          finalCouponCode = null;
        } else {
          const potentialCouponDiscount = couponCheck.calculatedDiscount || 0;
          if (potentialCouponDiscount > finalCampaignDiscount) {
            // Coupon beats campaign discount -> switch cart back to pre-campaign static prices & apply coupon
            evaluatedItems = evaluatedItems.map((line) => ({
              ...line,
              unitPrice: line.staticSellingPrice,
              subtotal: line.staticSellingPrice * line.quantity,
              campaignId: null,
              campaignName: null,
              campaignSlug: null,
              campaignDiscountPerUnit: 0,
              totalCampaignDiscount: 0,
              appliedCampaign: null,
            }));
            finalSubtotal = staticSubtotal;
            finalCampaignDiscount = 0;
            couponValid = true;
            couponDiscountAmount = Math.min(finalSubtotal, potentialCouponDiscount);
            stackingResolution = 'COUPON_WINS';
            stackingMessage = `Promo code ${finalCouponCode} applied because it saves you Rs. ${couponDiscountAmount.toLocaleString()} (more than the campaign sale).`;
          } else {
            // Campaign beats or ties coupon -> keep campaign discount, waive coupon
            couponValid = false;
            couponDiscountAmount = 0;
            couponError = `Active seasonal sale already saves you Rs. ${finalCampaignDiscount.toLocaleString()}, which is equal to or better than promo code ${finalCouponCode}.`;
            stackingResolution = 'CAMPAIGN_WINS';
            stackingMessage = couponError;
            finalCouponCode = null;
          }
        }
      } else {
        // ALLOW_COUPONS: apply coupon on top of campaign-discounted subtotal
        const couponCheck = await validateCouponServer({
          code: finalCouponCode,
          subtotal: finalSubtotal,
          isPreOrder: isPreOrderOrder,
          now,
        });

        if (!couponCheck.valid) {
          couponValid = false;
          couponDiscountAmount = 0;
          couponError = couponCheck.error || 'Invalid coupon code.';
          finalCouponCode = null;
        } else {
          couponValid = true;
          couponDiscountAmount = Math.min(finalSubtotal, couponCheck.calculatedDiscount || 0);
          stackingResolution = 'STACKED';
          stackingMessage = `Promo code ${finalCouponCode} stacked with active campaign discount.`;
        }
      }
    } else {
      // Standard checkout with no campaign discounts on cart items
      const couponCheck = await validateCouponServer({
        code: finalCouponCode,
        subtotal: finalSubtotal,
        isPreOrder: isPreOrderOrder,
        now,
      });

      if (!couponCheck.valid) {
        couponValid = false;
        couponDiscountAmount = 0;
        couponError = couponCheck.error || 'Invalid coupon code.';
        finalCouponCode = null;
      } else {
        couponValid = true;
        couponDiscountAmount = Math.min(finalSubtotal, couponCheck.calculatedDiscount || 0);
        stackingResolution = 'NONE';
      }
    }
  }

  // Compute shipping fee
  let shippingFee = typeof siteSettings.flatShippingFee === 'number' ? siteSettings.flatShippingFee : 250;
  if (evaluatedItems.length === 0) {
    shippingFee = 0;
  } else {
    const cityRule = params.city
      ? await prisma.shippingRule.findUnique({ where: { city: params.city } }).catch(() => null)
      : null;

    if (cityRule) {
      shippingFee = finalSubtotal >= cityRule.freeShippingMinAmount ? 0 : cityRule.charge;
    } else {
      const freeThreshold =
        typeof siteSettings.freeShippingThreshold === 'number'
          ? siteSettings.freeShippingThreshold
          : 10000;
      if (finalSubtotal >= freeThreshold) {
        shippingFee = 0;
      }
    }
  }

  // Compute COD charges (waived for pre-orders and full advance)
  const isAdvanceOrPreOrder =
    isPreOrderOrder ||
    params.paymentMethod === 'FULL_ADVANCE' ||
    params.paymentMethod === 'PRE_ORDER_ADVANCE';
  const codCharges = isAdvanceOrPreOrder ? 0 : (siteSettings.codCharge || 0);

  const totalAmount = Math.max(
    0,
    Math.round(finalSubtotal - couponDiscountAmount + shippingFee + codCharges)
  );

  // Campaign attribution summary for Order record & Analytics
  const discountByCampaign = new Map<string, { id: string; name: string; slug: string; amount: number }>();
  for (const item of evaluatedItems) {
    if (item.campaignId && item.totalCampaignDiscount > 0) {
      const prev = discountByCampaign.get(item.campaignId);
      if (prev) {
        prev.amount += item.totalCampaignDiscount;
      } else {
        discountByCampaign.set(item.campaignId, {
          id: item.campaignId,
          name: item.campaignName || 'Seasonal Campaign',
          slug: item.campaignSlug || '',
          amount: item.totalCampaignDiscount,
        });
      }
    }
  }

  const campaignEntries = Array.from(discountByCampaign.values()).sort((a, b) => b.amount - a.amount);
  const primaryCampaign = campaignEntries[0] || null;

  return {
    items: evaluatedItems,
    originalRetailSubtotal: Math.round(originalRetailSubtotal),
    staticSubtotal: Math.round(staticSubtotal),
    subtotal: Math.round(finalSubtotal),
    campaignDiscountAmount: Math.round(finalCampaignDiscount),
    couponCode: couponValid ? finalCouponCode : null,
    couponValid,
    couponDiscountAmount: Math.round(couponDiscountAmount),
    couponError,
    stackingResolution,
    stackingMessage,
    shippingFee: Math.round(shippingFee),
    codCharges: Math.round(codCharges),
    totalAmount,
    primaryCampaignId: primaryCampaign?.id || null,
    primaryCampaignName: primaryCampaign?.name || null,
    primaryCampaignSlug: primaryCampaign?.slug || null,
    campaignIds: campaignEntries.map((e) => e.id),
    activeCampaignCount: liveCampaigns.length,
    serverTimeMs: now.getTime(),
  };
}

