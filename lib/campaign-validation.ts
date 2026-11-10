import crypto from 'crypto';

const VALID_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
const VALID_SCOPES = ['STOREWIDE', 'COLLECTIONS', 'CATEGORIES', 'SELECTED_PRODUCTS'] as const;
const VALID_DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED'] as const;
const VALID_STACKING_MODES = ['BLOCK_COUPONS', 'ALLOW_COUPONS', 'BEST_DISCOUNT_ONLY'] as const;

export function sanitizeCampaignSlug(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generatePreviewToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export interface ValidatedCampaignPayload {
  name: string;
  slug: string;
  internalDescription: string | null;
  publicTitle: string;
  badgeText: string;
  status: (typeof VALID_STATUSES)[number];
  startDate: Date | null;
  endDate: Date | null;
  timezone: string;
  priority: number;
  scopeType: (typeof VALID_SCOPES)[number];
  includedProductIds: string[];
  excludedProductIds: string[];
  includedCollectionIds: string[];
  includedCategoryIds: string[];
  allowPreOrderProducts: boolean;
  couponStackingMode: (typeof VALID_STACKING_MODES)[number];
  discountType: (typeof VALID_DISCOUNT_TYPES)[number];
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
  ctaText: string;
  ctaLink: string | null;
  showCountdown: boolean;
  landingPageEnabled: boolean;
  landingPageDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export function validateCampaignPayload(
  body: any,
  isPartial: boolean = false,
  existing?: {
    discountType?: string;
    scopeType?: string;
    includedProductIds?: string[];
    excludedProductIds?: string[];
  }
): { valid: true; data: Partial<ValidatedCampaignPayload> } | { valid: false; error: string } {
  const out: Partial<ValidatedCampaignPayload> = {};

  if (!isPartial || body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) return { valid: false, error: 'Campaign internal name is required.' };
    out.name = name.slice(0, 140);
  }

  if (!isPartial || body.publicTitle !== undefined) {
    const publicTitle = String(body.publicTitle || '').trim();
    if (!publicTitle) return { valid: false, error: 'Campaign public title is required.' };
    out.publicTitle = publicTitle.slice(0, 180);
  }

  if (!isPartial || body.slug !== undefined) {
    const cleanSlug = sanitizeCampaignSlug(body.slug || body.name || '');
    if (!cleanSlug || cleanSlug.length < 2) {
      return { valid: false, error: 'Valid URL slug is required (e.g. 11-11, eid, winter-clearance).' };
    }
    out.slug = cleanSlug;
  }

  if (body.internalDescription !== undefined) {
    out.internalDescription = body.internalDescription ? String(body.internalDescription).trim() : null;
  }

  if (body.badgeText !== undefined) {
    out.badgeText = body.badgeText ? String(body.badgeText).trim().slice(0, 28) : 'SALE';
  } else if (!isPartial) {
    out.badgeText = 'SALE';
  }

  if (!isPartial || body.status !== undefined) {
    const rawStatus = String(body.status || 'DRAFT').toUpperCase();
    if (!VALID_STATUSES.includes(rawStatus as any)) {
      return { valid: false, error: `Invalid status "${rawStatus}".` };
    }
    out.status = rawStatus as any;
  }

  if (body.startDate !== undefined) {
    if (!body.startDate) {
      out.startDate = null;
    } else {
      const sd = new Date(body.startDate);
      if (isNaN(sd.getTime())) return { valid: false, error: 'Invalid campaign start date.' };
      out.startDate = sd;
    }
  }

  if (body.endDate !== undefined) {
    if (!body.endDate) {
      out.endDate = null;
    } else {
      const ed = new Date(body.endDate);
      if (isNaN(ed.getTime())) return { valid: false, error: 'Invalid campaign end date.' };
      out.endDate = ed;
    }
  }

  if (out.startDate && out.endDate && out.endDate.getTime() <= out.startDate.getTime()) {
    return { valid: false, error: 'Campaign end date/time must be strictly after the start date/time.' };
  }

  if (!isPartial || body.timezone !== undefined) {
    out.timezone = body.timezone ? String(body.timezone).trim() : 'Asia/Karachi';
  }

  if (!isPartial || body.priority !== undefined) {
    const p = Number(body.priority ?? 10);
    if (isNaN(p) || p < 0 || p > 10000) {
      return { valid: false, error: 'Priority must be a number between 0 and 10000.' };
    }
    out.priority = Math.round(p);
  }

  if (!isPartial || body.scopeType !== undefined) {
    const rawScope = String(body.scopeType || 'SELECTED_PRODUCTS').toUpperCase();
    if (!VALID_SCOPES.includes(rawScope as any)) {
      return { valid: false, error: `Invalid scope type "${rawScope}".` };
    }
    out.scopeType = rawScope as any;
  }

  const sanitizeIdList = (arr: any): string[] =>
    Array.isArray(arr) ? Array.from(new Set(arr.map((v) => String(v).trim()).filter(Boolean))) : [];

  if (!isPartial || body.includedProductIds !== undefined) {
    out.includedProductIds = sanitizeIdList(body.includedProductIds);
  }
  if (!isPartial || body.excludedProductIds !== undefined) {
    out.excludedProductIds = sanitizeIdList(body.excludedProductIds);
  }
  if (!isPartial || body.includedCollectionIds !== undefined) {
    out.includedCollectionIds = sanitizeIdList(body.includedCollectionIds);
  }
  if (!isPartial || body.includedCategoryIds !== undefined) {
    out.includedCategoryIds = sanitizeIdList(body.includedCategoryIds);
  }

  const effectiveScope = out.scopeType || existing?.scopeType;
  const effectiveIncluded = out.includedProductIds || existing?.includedProductIds;
  const effectiveExcluded = out.excludedProductIds || existing?.excludedProductIds;

  if (
    effectiveScope === 'SELECTED_PRODUCTS' &&
    effectiveIncluded &&
    effectiveExcluded
  ) {
    const overlap = effectiveIncluded.filter((id) => effectiveExcluded.includes(id));
    if (overlap.length > 0) {
      return {
        valid: false,
        error: 'A product cannot be simultaneously included and excluded in the same campaign.',
      };
    }
  }

  if (!isPartial || body.allowPreOrderProducts !== undefined) {
    out.allowPreOrderProducts = Boolean(body.allowPreOrderProducts);
  }

  if (!isPartial || body.couponStackingMode !== undefined) {
    const mode = String(body.couponStackingMode || 'BLOCK_COUPONS').toUpperCase();
    if (!VALID_STACKING_MODES.includes(mode as any)) {
      return { valid: false, error: `Invalid coupon stacking mode "${mode}".` };
    }
    out.couponStackingMode = mode as any;
  }

  if (!isPartial || body.discountType !== undefined) {
    const dtype = String(body.discountType || 'PERCENTAGE').toUpperCase();
    if (!VALID_DISCOUNT_TYPES.includes(dtype as any)) {
      return { valid: false, error: `Invalid discount type "${dtype}".` };
    }
    out.discountType = dtype as any;
  }

  if (!isPartial || body.discountValue !== undefined) {
    const dval = Number(body.discountValue ?? 0);
    if (isNaN(dval) || dval < 0) {
      return { valid: false, error: 'Discount value cannot be negative.' };
    }
    const targetType =
      out.discountType ||
      (body.discountType ? String(body.discountType).toUpperCase() : existing?.discountType || 'PERCENTAGE');
    if (targetType === 'PERCENTAGE' && dval > 95) {
      return { valid: false, error: 'Percentage discount cannot exceed 95%.' };
    }
    out.discountValue = dval;
  }

  if (body.maxDiscountAmount !== undefined) {
    if (body.maxDiscountAmount === null || body.maxDiscountAmount === '') {
      out.maxDiscountAmount = null;
    } else {
      const cap = Number(body.maxDiscountAmount);
      if (isNaN(cap) || cap < 0) {
        return { valid: false, error: 'Maximum discount cap must be a non-negative number.' };
      }
      out.maxDiscountAmount = cap;
    }
  }

  if (body.bannerTitle !== undefined) out.bannerTitle = body.bannerTitle ? String(body.bannerTitle).trim() : null;
  if (body.bannerSubtitle !== undefined) out.bannerSubtitle = body.bannerSubtitle ? String(body.bannerSubtitle).trim() : null;
  if (body.desktopBannerUrl !== undefined) out.desktopBannerUrl = body.desktopBannerUrl ? String(body.desktopBannerUrl).trim() : null;
  if (body.mobileBannerUrl !== undefined) out.mobileBannerUrl = body.mobileBannerUrl ? String(body.mobileBannerUrl).trim() : null;
  if (!isPartial || body.showBanner !== undefined) out.showBanner = body.showBanner !== undefined ? Boolean(body.showBanner) : true;
  if (!isPartial || body.replaceHeroSlider !== undefined) out.replaceHeroSlider = Boolean(body.replaceHeroSlider);
  if (!isPartial || body.announcementEnabled !== undefined) out.announcementEnabled = Boolean(body.announcementEnabled);
  if (body.announcementText !== undefined) out.announcementText = body.announcementText ? String(body.announcementText).trim() : null;
  if (!isPartial || body.ctaText !== undefined) out.ctaText = body.ctaText ? String(body.ctaText).trim() : 'Shop Sale';
  if (body.ctaLink !== undefined) out.ctaLink = body.ctaLink ? String(body.ctaLink).trim() : null;
  if (!isPartial || body.showCountdown !== undefined) out.showCountdown = body.showCountdown !== undefined ? Boolean(body.showCountdown) : true;
  if (!isPartial || body.landingPageEnabled !== undefined) out.landingPageEnabled = body.landingPageEnabled !== undefined ? Boolean(body.landingPageEnabled) : true;
  if (body.landingPageDescription !== undefined) out.landingPageDescription = body.landingPageDescription ? String(body.landingPageDescription).trim() : null;
  if (body.seoTitle !== undefined) out.seoTitle = body.seoTitle ? String(body.seoTitle).trim() : null;
  if (body.seoDescription !== undefined) out.seoDescription = body.seoDescription ? String(body.seoDescription).trim() : null;

  return { valid: true, data: out };
}

