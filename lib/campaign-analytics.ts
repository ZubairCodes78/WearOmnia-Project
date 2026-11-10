import { prisma } from '@/lib/prisma';

export interface CampaignProductSaleStat {
  productId: string | null;
  productTitle: string;
  unitsSold: number;
  grossValue: number;
  discountGranted: number;
  netRevenue: number;
  ordersCount: number;
}

export interface CampaignCouponUsageStat {
  couponCode: string;
  ordersCount: number;
  totalCouponDiscount: number;
}

export interface CampaignAnalyticsReport {
  campaignId: string;
  campaignOrdersCount: number;
  cancelledOrReturnedCount: number;
  grossMerchandiseValue: number;
  campaignDiscountsGranted: number;
  couponDiscountsGranted: number;
  totalDiscountsGranted: number;
  netMerchandiseRevenue: number;
  totalChargedRevenue: number;
  averageOrderValue: number;
  unitsSold: number;
  salesByProduct: CampaignProductSaleStat[];
  couponUsage: CampaignCouponUsageStat[];
  revenueNote: string;
}

/**
 * Computes strictly verified financial analytics for a campaign from persisted Order & OrderItem records.
 * Distinguishes Gross Merchandise Value, Discounts Granted, and Net Revenue after discounts.
 * Never fabricates profit without cost data.
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalyticsReport> {
  const matchingOrders = await prisma.order.findMany({
    where: {
      OR: [
        { campaignId },
        { campaignIds: { has: campaignId } },
        { items: { some: { campaignId } } },
      ],
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const validOrders = matchingOrders.filter((o) => !['CANCELLED', 'RETURNED'].includes(o.status));
  const cancelledOrReturnedCount = matchingOrders.length - validOrders.length;

  let grossMerchandiseValue = 0;
  let campaignDiscountsGranted = 0;
  let couponDiscountsGranted = 0;
  let netMerchandiseBeforeCoupons = 0;
  let totalChargedRevenue = 0;
  let unitsSold = 0;

  const productStatsMap = new Map<string, CampaignProductSaleStat & { orderIds: Set<string> }>();
  const couponMap = new Map<string, CampaignCouponUsageStat>();

  for (const order of validOrders) {
    totalChargedRevenue += Number(order.totalAmount) || 0;

    // Coupon tracking for orders where campaign also participated
    const orderCouponDiscount = Number(order.couponDiscountAmount || order.discountAmount || 0);
    const campaignItems = order.items.filter(
      (item) => item.campaignId === campaignId || (!item.campaignId && order.campaignId === campaignId)
    );

    const itemsToCount = campaignItems.length > 0 ? campaignItems : order.items;
    let orderCampaignItemsSubtotal = 0;
    let orderTotalItemsSubtotal = 0;

    for (const item of order.items) {
      orderTotalItemsSubtotal += Number(item.subtotal) || 0;
    }

    for (const item of itemsToCount) {
      const qty = Math.max(0, Number(item.quantity) || 0);
      const unitPrice = Number(item.unitPrice) || 0;
      const originalUnit = Number(item.originalPrice ?? unitPrice) || unitPrice;
      const discountPerUnit = Number(item.campaignDiscountPerUnit) || Math.max(0, originalUnit - unitPrice);
      const itemNet = Number(item.subtotal) || unitPrice * qty;
      const itemDiscount = discountPerUnit * qty;
      const itemGross = originalUnit * qty;

      grossMerchandiseValue += itemGross;
      campaignDiscountsGranted += itemDiscount;
      netMerchandiseBeforeCoupons += itemNet;
      orderCampaignItemsSubtotal += itemNet;
      unitsSold += qty;

      const key = item.productId || `title:${item.productTitle}`;
      let prodStat = productStatsMap.get(key);
      if (!prodStat) {
        prodStat = {
          productId: item.productId,
          productTitle: item.productTitle,
          unitsSold: 0,
          grossValue: 0,
          discountGranted: 0,
          netRevenue: 0,
          ordersCount: 0,
          orderIds: new Set<string>(),
        };
        productStatsMap.set(key, prodStat);
      }
      prodStat.unitsSold += qty;
      prodStat.grossValue += itemGross;
      prodStat.discountGranted += itemDiscount;
      prodStat.netRevenue += itemNet;
      prodStat.orderIds.add(order.id);
    }

    if (orderCouponDiscount > 0) {
      const shareRatio =
        orderTotalItemsSubtotal > 0
          ? Math.min(1, orderCampaignItemsSubtotal / orderTotalItemsSubtotal)
          : 1;
      const attributedCouponDiscount = Math.round(orderCouponDiscount * shareRatio);
      couponDiscountsGranted += attributedCouponDiscount;

      if (order.couponCode) {
        const cleanCode = order.couponCode.trim().toUpperCase();
        const prev = couponMap.get(cleanCode);
        if (prev) {
          prev.ordersCount += 1;
          prev.totalCouponDiscount += orderCouponDiscount;
        } else {
          couponMap.set(cleanCode, {
            couponCode: cleanCode,
            ordersCount: 1,
            totalCouponDiscount: orderCouponDiscount,
          });
        }
      }
    }
  }

  const totalDiscountsGranted = Math.round(campaignDiscountsGranted + couponDiscountsGranted);
  const netMerchandiseRevenue = Math.max(0, Math.round(netMerchandiseBeforeCoupons - couponDiscountsGranted));
  const campaignOrdersCount = validOrders.length;
  const averageOrderValue =
    campaignOrdersCount > 0 ? Math.round(totalChargedRevenue / campaignOrdersCount) : 0;

  const salesByProduct: CampaignProductSaleStat[] = Array.from(productStatsMap.values())
    .map(({ orderIds, ...rest }) => ({
      ...rest,
      ordersCount: orderIds.size,
      grossValue: Math.round(rest.grossValue),
      discountGranted: Math.round(rest.discountGranted),
      netRevenue: Math.round(rest.netRevenue),
    }))
    .sort((a, b) => b.netRevenue - a.netRevenue);

  const couponUsage = Array.from(couponMap.values()).sort(
    (a, b) => b.ordersCount - a.ordersCount
  );

  return {
    campaignId,
    campaignOrdersCount,
    cancelledOrReturnedCount,
    grossMerchandiseValue: Math.round(grossMerchandiseValue),
    campaignDiscountsGranted: Math.round(campaignDiscountsGranted),
    couponDiscountsGranted: Math.round(couponDiscountsGranted),
    totalDiscountsGranted,
    netMerchandiseRevenue,
    totalChargedRevenue: Math.round(totalChargedRevenue),
    averageOrderValue,
    unitsSold,
    salesByProduct,
    couponUsage,
    revenueNote:
      'Figures reflect actual charged order totals and historical snapshot prices excluding cancelled/returned orders. Profit is intentionally not fabricated without complete per-order unit cost data.',
  };
}

