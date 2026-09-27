import { prisma } from './prisma';

/**
 * Generates the next sequential customer-facing WearOMNIA order number.
 * Format: "0001", "0002", "0003", ...
 * No prefixes like "ORD-", "#ORD", or "2026-".
 */
export async function generateNextOrderNumber(tx?: any): Promise<string> {
  const client = tx || prisma;
  try {
    const result: any = await client.$queryRaw`
      SELECT MAX(CAST("orderNumber" AS INTEGER)) as max_num 
      FROM "Order" 
      WHERE "orderNumber" ~ '^[0-9]+$'
    `;
    const maxVal = result?.[0]?.max_num != null ? Number(result[0].max_num) : 0;
    const nextNum = maxVal + 1;
    return String(nextNum).padStart(4, '0');
  } catch (err) {
    console.warn('PostgreSQL raw query for max orderNumber failed, using fallback:', err);
    const orders = await client.order.findMany({
      select: { orderNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    let max = 0;
    for (const o of orders) {
      if (/^\d+$/.test(o.orderNumber)) {
        const n = parseInt(o.orderNumber, 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return String(max + 1).padStart(4, '0');
  }
}

/**
 * Formats an order number for display.
 * Returns the exact sequential format e.g. "0001", "0002", or preserves existing older formats.
 */
export function formatOrderNumber(orderNumber: string | null | undefined): string {
  if (!orderNumber) return '';
  const clean = orderNumber.replace(/^#/, '').trim();
  if (/^\d+$/.test(clean)) {
    return clean.length < 4 ? clean.padStart(4, '0') : clean;
  }
  return clean;
}
