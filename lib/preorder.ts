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
 * Default campaign parameters for WearOMNIA Pre-Order Launch
 * 29 September 2026 -> 20 October 2026 (Asia/Karachi timezone)
 */
export const DEFAULT_PREORDER_CAMPAIGN = {
  startDate: process.env.NEXT_PUBLIC_PREORDER_START_DATE || '2026-09-29',
  endDate: process.env.NEXT_PUBLIC_PREORDER_END_DATE || '2026-10-20',
  timezone: 'Asia/Karachi',
};

/**
 * Checks whether current time in Asia/Karachi (Pakistan Standard Time)
 * falls strictly within the active Pre-Order campaign window (inclusive).
 * After 20 October 2026, this automatically returns false.
 */
export function isPreOrderCampaignActive(
  customNow?: Date,
  campaignConfig = DEFAULT_PREORDER_CAMPAIGN
): boolean {
  try {
    const now = customNow || new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: campaignConfig.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const karachiDateStr = formatter.format(now); // "YYYY-MM-DD"
    return (
      karachiDateStr >= campaignConfig.startDate &&
      karachiDateStr <= campaignConfig.endDate
    );
  } catch {
    return false;
  }
}
