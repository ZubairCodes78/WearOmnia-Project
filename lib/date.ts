/**
 * WearOMNIA Canonical Date & Time Utility
 * Strict timezone: Asia/Karachi (Pakistan Standard Time, UTC+05:00)
 */

/**
 * Format a database order creation timestamp (e.g. Order.createdAt)
 * into a customer-friendly Pakistan Standard Time display.
 *
 * Example:
 * formatOrderPlacementTime('2026-10-08T18:42:00.000Z') -> "8 October 2026 at 11:42 PM"
 */
export function formatOrderPlacementTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const formatted = formatter.format(d);
    // Standardize AM/PM casing
    return formatted.replace(/\b([ap]m)\b/i, (match) => match.toUpperCase());
  } catch {
    return '—';
  }
}

/**
 * Format timestamp as "Placed on 8 October 2026 at 11:42 PM"
 */
export function formatPlacedOnDate(dateInput: Date | string | number | null | undefined): string {
  const formatted = formatOrderPlacementTime(dateInput);
  if (formatted === '—') return '—';
  return `Placed on ${formatted}`;
}

/**
 * Format timestamp as "8 October 2026, 11:42 PM" (comma variant)
 */
export function formatOrderPlacedComma(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';

    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d);

    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const hour = parts.find((p) => p.type === 'hour')?.value || '';
    const minute = parts.find((p) => p.type === 'minute')?.value || '';
    const dayPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value || '').toUpperCase();

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`.trim();
  } catch {
    return '—';
  }
}
