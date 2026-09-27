import { prisma } from '@/lib/prisma';

export interface CouponScheduleStatus {
  status: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  label: string;
  durationDisplay?: string;
  startDateFormatted?: string;
  endDateFormatted?: string;
}

/**
 * Format a Date or ISO string into Asia/Karachi display
 */
export function formatKarachiDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';

    // Format e.g. "29 Sep 2026, 12:00 AM"
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(d);
  } catch {
    return '—';
  }
}

/**
 * Format date for input[type="date"] and input[type="time"] in Asia/Karachi
 */
export function getKarachiInputValues(dateInput: Date | string | null | undefined): { date: string; time: string } {
  if (!dateInput) return { date: '', time: '00:00' };
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return { date: '', time: '00:00' };

    // Format parts in Asia/Karachi
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';

    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}`,
    };
  } catch {
    return { date: '', time: '00:00' };
  }
}

/**
 * Parse date string and time string in Asia/Karachi timezone (+05:00) into a Date
 */
export function parseKarachiDateTime(dateStr: string, timeStr: string = '00:00'): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const cleanDate = dateStr.trim();
  const cleanTime = (timeStr || '00:00').trim().padEnd(5, ':00').slice(0, 5);
  // ISO 8601 with Asia/Karachi (+05:00) offset
  const isoStr = `${cleanDate}T${cleanTime}:00+05:00`;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculates human-readable duration between start and end date
 */
export function calculateDurationDisplay(startDate?: Date | string | null, endDate?: Date | string | null): string {
  if (!startDate || !endDate) return 'Ongoing';
  const start = typeof startDate === 'string' ? new Date(startDate).getTime() : startDate.getTime();
  const end = typeof endDate === 'string' ? new Date(endDate).getTime() : endDate.getTime();
  const diffMs = end - start;
  if (diffMs <= 0) return '0 hours';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days > 0 && remainingHours > 0) {
    return `${days} Day${days > 1 ? 's' : ''}, ${remainingHours} Hr${remainingHours > 1 ? 's' : ''}`;
  } else if (days > 0) {
    return `${days} Day${days > 1 ? 's' : ''}`;
  } else {
    return `${totalHours} Hour${totalHours > 1 ? 's' : ''}`;
  }
}

/**
 * Evaluates the schedule status of a coupon based on server time
 */
export function getCouponScheduleStatus(
  coupon: {
    isActive: boolean;
    startDate?: Date | string | null;
    expiryDate?: Date | string | null;
    timezone?: string;
  },
  now: Date = new Date()
): CouponScheduleStatus {
  if (!coupon.isActive) {
    return {
      status: 'DISABLED',
      label: 'Disabled',
      durationDisplay: calculateDurationDisplay(coupon.startDate, coupon.expiryDate),
      startDateFormatted: formatKarachiDateTime(coupon.startDate),
      endDateFormatted: formatKarachiDateTime(coupon.expiryDate),
    };
  }

  const nowMs = now.getTime();
  const startMs = coupon.startDate ? new Date(coupon.startDate).getTime() : null;
  const endMs = coupon.expiryDate ? new Date(coupon.expiryDate).getTime() : null;

  if (startMs && nowMs < startMs) {
    return {
      status: 'SCHEDULED',
      label: 'Scheduled',
      durationDisplay: calculateDurationDisplay(coupon.startDate, coupon.expiryDate),
      startDateFormatted: formatKarachiDateTime(coupon.startDate),
      endDateFormatted: formatKarachiDateTime(coupon.expiryDate),
    };
  }

  if (endMs && nowMs > endMs) {
    return {
      status: 'EXPIRED',
      label: 'Expired',
      durationDisplay: calculateDurationDisplay(coupon.startDate, coupon.expiryDate),
      startDateFormatted: formatKarachiDateTime(coupon.startDate),
      endDateFormatted: formatKarachiDateTime(coupon.expiryDate),
    };
  }

  return {
    status: 'ACTIVE',
    label: 'Active',
    durationDisplay: calculateDurationDisplay(coupon.startDate, coupon.expiryDate),
    startDateFormatted: formatKarachiDateTime(coupon.startDate),
    endDateFormatted: formatKarachiDateTime(coupon.expiryDate),
  };
}

export interface CouponValidationOptions {
  code: string;
  subtotal: number;
  isPreOrder?: boolean;
  now?: Date;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  calculatedDiscount?: number;
  isPreOrderOnly?: boolean;
  autoApply?: boolean;
  status?: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
}

/**
 * Single Canonical Server-side Coupon Validator
 * Checks coupon strictly against database records, scheduling dates, and rules.
 */
export async function validateCouponServer({
  code,
  subtotal,
  isPreOrder = false,
  now = new Date(),
}: CouponValidationOptions): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return { valid: false, error: 'Coupon code is required.' };
  }

  const cleanCode = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon) {
    return { valid: false, error: 'Invalid or unrecognized coupon code.' };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      error: `Coupon "${cleanCode}" is currently disabled by store administration.`,
      status: 'DISABLED',
    };
  }

  const nowMs = now.getTime();

  // Check start date (before launch)
  if (coupon.startDate) {
    const startMs = new Date(coupon.startDate).getTime();
    if (nowMs < startMs) {
      const formattedStart = formatKarachiDateTime(coupon.startDate);
      return {
        valid: false,
        error: `Coupon "${cleanCode}" is scheduled to become active on ${formattedStart} (Asia/Karachi).`,
        status: 'SCHEDULED',
      };
    }
  }

  // Check end date (expiry)
  if (coupon.expiryDate) {
    const endMs = new Date(coupon.expiryDate).getTime();
    if (nowMs > endMs) {
      const formattedEnd = formatKarachiDateTime(coupon.expiryDate);
      return {
        valid: false,
        error: `Coupon "${cleanCode}" expired on ${formattedEnd} (Asia/Karachi).`,
        status: 'EXPIRED',
      };
    }
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      error: `Coupon "${cleanCode}" usage limit of ${coupon.usageLimit} has been reached.`,
    };
  }

  // Check pre-order exclusivity
  if (coupon.isPreOrderOnly && !isPreOrder) {
    return {
      valid: false,
      error: `Coupon "${cleanCode}" is valid exclusively for pre-order collection bookings.`,
    };
  }

  // Check minimum spend
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order spend of Rs. ${coupon.minOrderAmount.toLocaleString()} is required for coupon "${cleanCode}".`,
    };
  }

  // Calculate discount amount
  let calculatedDiscount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    calculatedDiscount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
      calculatedDiscount = coupon.maxDiscountAmount;
    }
  } else {
    calculatedDiscount = coupon.discountValue;
  }

  // Ensure discount does not exceed subtotal
  calculatedDiscount = Math.min(calculatedDiscount, subtotal);
  calculatedDiscount = Math.round(calculatedDiscount);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    calculatedDiscount,
    isPreOrderOnly: coupon.isPreOrderOnly,
    autoApply: coupon.autoApply,
    status: 'ACTIVE',
  };
}

/**
 * Returns the public campaign configuration for the Pre-Order launch.
 * Reads directly from the database record for PREORDER500 so any admin schedule changes take effect immediately.
 */
export async function getPreOrderCampaignConfig() {
  const coupon = await prisma.coupon.findUnique({
    where: { code: 'PREORDER500' },
  });

  const now = new Date();
  const nowMs = now.getTime();

  // If found in DB, use its dynamic scheduling dates
  if (coupon) {
    const startMs = coupon.startDate
      ? new Date(coupon.startDate).getTime()
      : new Date('2026-09-29T00:00:00+05:00').getTime();
    const endMs = coupon.expiryDate
      ? new Date(coupon.expiryDate).getTime()
      : new Date('2026-10-20T23:59:59+05:00').getTime();

    let phase: 'BEFORE_LAUNCH' | 'ACTIVE' | 'ENDED' = 'BEFORE_LAUNCH';
    if (!coupon.isActive) {
      phase = 'ENDED'; // or disabled
    } else if (nowMs < startMs) {
      phase = 'BEFORE_LAUNCH';
    } else if (nowMs > endMs) {
      phase = 'ENDED';
    } else {
      phase = 'ACTIVE';
    }

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: coupon.discountValue, // alias for backwards compatibility
      currency: 'PKR',
      currencySymbol: 'Rs.',
      timezone: coupon.timezone || 'Asia/Karachi',
      productionSiteUrl: 'https://www.wearomnia.com/',
      startTimestampMs: startMs,
      endTimestampMs: endMs,
      startDateFormatted: formatKarachiDateTime(coupon.startDate || '2026-09-29T00:00:00+05:00'),
      endDateFormatted: formatKarachiDateTime(coupon.expiryDate || '2026-10-20T23:59:59+05:00'),
      isActive: coupon.isActive,
      phase,
      isPreOrderOnly: coupon.isPreOrderOnly,
      autoApply: false, // PREORDER500 must NEVER auto-apply
      serverTimeMs: nowMs,
    };
  }

  // Fallback defaults
  const fallbackStartMs = new Date('2026-09-29T00:00:00+05:00').getTime();
  const fallbackEndMs = new Date('2026-10-20T23:59:59+05:00').getTime();
  return {
    code: 'PREORDER500',
    discountType: 'FIXED',
    discountValue: 500,
    discountAmount: 500,
    currency: 'PKR',
    currencySymbol: 'Rs.',
    timezone: 'Asia/Karachi',
    productionSiteUrl: 'https://www.wearomnia.com/',
    startTimestampMs: fallbackStartMs,
    endTimestampMs: fallbackEndMs,
    startDateFormatted: '29 Sep 2026, 12:00 AM',
    endDateFormatted: '20 Oct 2026, 11:59 PM',
    isActive: true,
    phase: nowMs < fallbackStartMs ? 'BEFORE_LAUNCH' : nowMs > fallbackEndMs ? 'ENDED' : 'ACTIVE',
    isPreOrderOnly: true,
    autoApply: false,
    serverTimeMs: nowMs,
  };
}
