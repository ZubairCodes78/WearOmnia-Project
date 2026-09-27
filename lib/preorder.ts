import { prisma } from '@/lib/prisma';
import { getPreOrderSettings } from '@/lib/settings';

export const PRE_ORDER_PAYMENT_STATUSES = {
  REVIEW_PENDING: 'PAYMENT_REVIEW_PENDING',
  APPROVED: 'PAYMENT_APPROVED',
  REJECTED: 'PAYMENT_REJECTED',
} as const;

export type PreOrderPaymentStatus = typeof PRE_ORDER_PAYMENT_STATUSES[keyof typeof PRE_ORDER_PAYMENT_STATUSES];

export interface PreOrderCalculatedAmounts {
  advancePercent: number;
  advanceAmount: number;
  remainingAmount: number;
}

/**
 * Calculates advance and remaining amounts for a pre-order total safely.
 * Rounds advance amount to two decimal places, remaining amount is total - advance.
 */
export function calculatePreOrderAmounts(
  totalAmount: number,
  advancePercent: number
): PreOrderCalculatedAmounts {
  const percent = Math.min(100, Math.max(1, Math.round(advancePercent)));
  const rawAdvance = (totalAmount * percent) / 100;
  // Round to nearest integer (PKR standard) or 2 decimals
  const advanceAmount = Math.round(rawAdvance);
  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  return {
    advancePercent: percent,
    advanceAmount,
    remainingAmount,
  };
}

/**
 * Checks if pre-orders are currently operational (enabled in settings AND has at least 1 active payment method)
 */
export async function isPreOrderSystemOperational(): Promise<{
  operational: boolean;
  reason?: string;
  advancePercent: number;
  instructions: string;
}> {
  const settings = await getPreOrderSettings();
  if (!settings.preorder_enabled) {
    return {
      operational: false,
      reason: 'Pre-orders are currently not enabled by store management.',
      advancePercent: settings.preorder_advance_percent || 50,
      instructions: settings.preorder_payment_instructions || '',
    };
  }

  const activeMethodsCount = await prisma.preOrderPaymentMethod.count({
    where: { isActive: true },
  });

  if (activeMethodsCount === 0) {
    return {
      operational: false,
      reason: 'No active pre-order payment methods are configured.',
      advancePercent: settings.preorder_advance_percent || 50,
      instructions: settings.preorder_payment_instructions || '',
    };
  }

  return {
    operational: true,
    advancePercent: settings.preorder_advance_percent || 50,
    instructions: settings.preorder_payment_instructions || '',
  };
}

/**
 * Canonical Single Central Campaign Configuration for WearOMNIA Pre-Order Launch
 * 29 September 2026 00:00:00 PKT -> 20 October 2026 23:59:59 PKT
 * Timezone: Asia/Karachi (UTC+05:00)
 */
export const WEAROMNIA_CAMPAIGN = {
  name: 'WearOMNIA Pre-Order Launch Edition 001',
  code: 'PREORDER500',
  discountAmount: 500, // PKR 500
  currency: 'PKR',
  currencySymbol: 'Rs.',
  timezone: 'Asia/Karachi',
  startIso: '2026-09-29T00:00:00+05:00',
  endIso: '2026-10-20T23:59:59+05:00',
  startDateDisplay: '29 September 2026',
  endDateDisplay: '20 October 2026',
  startTimestampMs: new Date('2026-09-29T00:00:00+05:00').getTime(),
  endTimestampMs: new Date('2026-10-20T23:59:59+05:00').getTime(),
} as const;

export type CampaignPhase = 'BEFORE_LAUNCH' | 'ACTIVE' | 'ENDED';

/**
 * Returns the current campaign phase strictly evaluated against canonical epoch timestamps:
 * - 'BEFORE_LAUNCH': before 29 September 2026 00:00:00 PKT
 * - 'ACTIVE': 29 September 2026 00:00:00 PKT through 20 October 2026 23:59:59 PKT
 * - 'ENDED': after 20 October 2026 23:59:59 PKT
 */
export function getCampaignPhase(nowMs: number = Date.now()): CampaignPhase {
  if (nowMs < WEAROMNIA_CAMPAIGN.startTimestampMs) {
    return 'BEFORE_LAUNCH';
  }
  if (nowMs > WEAROMNIA_CAMPAIGN.endTimestampMs) {
    return 'ENDED';
  }
  return 'ACTIVE';
}

/**
 * Checks whether current time in Asia/Karachi falls strictly within the active Pre-Order campaign window.
 */
export function isPreOrderCampaignActive(nowMs: number = Date.now()): boolean {
  return getCampaignPhase(nowMs) === 'ACTIVE';
}

export interface CountdownTimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isZero: boolean;
}

/**
 * Calculates remaining days, hours, minutes, and seconds to a target timestamp.
 * Returns 00:00:00:00 when target is reached (never negative).
 */
export function calculateTimeRemaining(
  targetTimestampMs: number,
  currentTimestampMs: number = Date.now()
): CountdownTimeRemaining {
  const diffMs = Math.max(0, targetTimestampMs - currentTimestampMs);

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isZero: true,
    };
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    isZero: false,
  };
}

/**
 * Validates PREORDER500 coupon code against the central campaign dates.
 */
export function validatePreOrderCampaignCoupon(
  code: string,
  nowMs: number = Date.now()
): { valid: boolean; error?: string; discountAmount?: number } {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode !== WEAROMNIA_CAMPAIGN.code) {
    return { valid: false, error: 'Invalid or unrecognized coupon code.' };
  }

  const phase = getCampaignPhase(nowMs);
  if (phase === 'BEFORE_LAUNCH') {
    return {
      valid: false,
      error: `Coupon ${WEAROMNIA_CAMPAIGN.code} will become active on ${WEAROMNIA_CAMPAIGN.startDateDisplay} at 00:00 PKT.`,
    };
  }

  if (phase === 'ENDED') {
    return {
      valid: false,
      error: `Coupon ${WEAROMNIA_CAMPAIGN.code} expired on ${WEAROMNIA_CAMPAIGN.endDateDisplay}.`,
    };
  }

  return {
    valid: true,
    discountAmount: WEAROMNIA_CAMPAIGN.discountAmount,
  };
}

