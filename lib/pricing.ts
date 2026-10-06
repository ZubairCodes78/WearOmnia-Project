/**
 * WearOMNIA Canonical Pricing & Inventory Stock Valuation Engine
 *
 * Single Source of Truth for:
 * 1. Product Effective Selling Price (Original vs Sale/Discounted Price)
 * 2. Stock Selling Value (Units × Effective Selling Price)
 * 3. Stock Cost Value (Units × Cost Price)
 * 4. Potential Gross Profit (Units × [Effective Selling Price - Cost Price])
 * 5. Aggregate Catalog & Inventory Valuation
 */

export interface ProductPricingLike {
  basePrice: number | string;
  discountPrice?: number | string | null;
  costPrice?: number | string | null;
  stockQuantity?: number | null;
  variants?: Array<{ stock: number }> | null;
}

export interface StockValuationResult {
  originalPrice: number;
  effectiveSellingPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
  costPrice: number;
  stockQuantity: number;
  stockSellingValue: number;
  stockCostValue: number;
  potentialGrossProfit: number;
}

export interface InventoryTotalsResult {
  totalUnits: number;
  totalSellingValue: number;
  totalCostValue: number;
  potentialGrossProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
}

/**
 * Returns the effective customer-facing selling price of a product.
 * If a valid discountPrice is configured (greater than 0 and less than basePrice),
 * it returns discountPrice. Otherwise, returns basePrice.
 *
 * Example:
 *   Original = 4500, Sale = 4000 -> 4000
 *   Original = 4500, Sale = 4500 -> 4500
 *   Original = 4500, Sale = null -> 4500
 */
export function getEffectiveSellingPrice(product: {
  basePrice: number | string;
  discountPrice?: number | string | null;
}): number {
  if (!product) return 0;

  const base =
    typeof product.basePrice === 'number'
      ? product.basePrice
      : parseFloat(String(product.basePrice)) || 0;

  const rawDiscount = product.discountPrice;
  if (rawDiscount === null || rawDiscount === undefined || rawDiscount === '') {
    return Math.max(0, base);
  }

  const discount =
    typeof rawDiscount === 'number'
      ? rawDiscount
      : parseFloat(String(rawDiscount));

  if (!isNaN(discount) && discount > 0 && discount < base) {
    return Math.max(0, discount);
  }

  return Math.max(0, base);
}

/**
 * Returns the discount amount (Original Price - Effective Selling Price).
 */
export function getProductDiscountAmount(product: {
  basePrice: number | string;
  discountPrice?: number | string | null;
}): number {
  if (!product) return 0;
  const base =
    typeof product.basePrice === 'number'
      ? product.basePrice
      : parseFloat(String(product.basePrice)) || 0;
  const effective = getEffectiveSellingPrice(product);
  return Math.max(0, base - effective);
}

/**
 * Calculates the clean whole integer discount percentage from original price and selling price.
 * Formula: ((originalPrice - sellingPrice) / originalPrice) * 100
 *
 * Rules:
 * - If originalPrice <= sellingPrice, returns 0 (no discount)
 * - If originalPrice <= 0 or sellingPrice <= 0, returns 0
 * - Rounds appropriately to a clean whole percentage (Math.round)
 *
 * Examples:
 *   4500 -> 4000 = 11% OFF
 *   4500 -> 3500 = 22% OFF
 *   5000 -> 3500 = 30% OFF
 */
export function calculateDiscountPercent(
  originalPrice: number | string,
  sellingPrice?: number | string | null
): number {
  const original =
    typeof originalPrice === 'number'
      ? originalPrice
      : parseFloat(String(originalPrice)) || 0;

  if (original <= 0) return 0;

  const selling =
    sellingPrice !== undefined && sellingPrice !== null
      ? (typeof sellingPrice === 'number' ? sellingPrice : parseFloat(String(sellingPrice)) || 0)
      : original;

  if (selling <= 0 || selling >= original) return 0;

  const percent = Math.round(((original - selling) / original) * 100);
  return percent > 0 && percent < 100 ? percent : 0;
}

/**
 * Returns the clean whole discount percentage for a product object.
 */
export function getProductDiscountPercent(product: {
  basePrice: number | string;
  discountPrice?: number | string | null;
}): number {
  if (!product) return 0;
  const original =
    typeof product.basePrice === 'number'
      ? product.basePrice
      : parseFloat(String(product.basePrice)) || 0;
  const effective = getEffectiveSellingPrice(product);
  return calculateDiscountPercent(original, effective);
}

/**
 * Calculates stock valuation breakdown for a single product or SKU.
 *
 * Stock Selling Value = stockQuantity × effectiveSellingPrice
 * Stock Cost Value    = stockQuantity × costPrice
 * Potential Gross Profit = stockQuantity × (effectiveSellingPrice - costPrice)
 *
 * IMPORTANT: Never confuses selling price with cost price, and never calculates
 * profit using the original/compare-at price when a sale price is active.
 */
export function calculateStockValuation(params: {
  basePrice: number | string;
  discountPrice?: number | string | null;
  costPrice?: number | string | null;
  stockQuantity?: number | null;
}): StockValuationResult {
  const originalPrice =
    typeof params.basePrice === 'number'
      ? params.basePrice
      : parseFloat(String(params.basePrice)) || 0;

  const effectiveSellingPrice = getEffectiveSellingPrice(params);
  const discountAmount = Math.max(0, originalPrice - effectiveSellingPrice);
  const hasDiscount = discountAmount > 0;

  const rawCost = params.costPrice;
  const costPrice =
    rawCost !== null && rawCost !== undefined && rawCost !== ''
      ? Math.max(0, typeof rawCost === 'number' ? rawCost : parseFloat(String(rawCost)) || 0)
      : 0;

  const rawStock = params.stockQuantity;
  const stockQuantity = Math.max(
    0,
    typeof rawStock === 'number' ? rawStock : parseInt(String(rawStock), 10) || 0
  );

  const stockSellingValue = stockQuantity * effectiveSellingPrice;
  const stockCostValue = stockQuantity * costPrice;
  const potentialGrossProfit = stockQuantity * (effectiveSellingPrice - costPrice);

  return {
    originalPrice,
    effectiveSellingPrice,
    discountAmount,
    hasDiscount,
    costPrice,
    stockQuantity,
    stockSellingValue,
    stockCostValue,
    potentialGrossProfit,
  };
}

/**
 * Calculates inventory totals across an entire product catalog.
 * Handles products with or without variants.
 */
export function calculateInventoryTotals(
  products: ProductPricingLike[],
  options?: { defaultCostPriceRatio?: number }
): InventoryTotalsResult {
  let totalUnits = 0;
  let totalSellingValue = 0;
  let totalCostValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;

  for (const p of products) {
    const units =
      p.variants && p.variants.length > 0
        ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : Math.max(0, Number(p.stockQuantity) || 0);

    const effectivePrice = getEffectiveSellingPrice(p);

    let unitCost = 0;
    if (p.costPrice !== null && p.costPrice !== undefined && p.costPrice !== '') {
      unitCost = Math.max(0, Number(p.costPrice) || 0);
    } else if (options?.defaultCostPriceRatio) {
      unitCost = Math.round(effectivePrice * options.defaultCostPriceRatio);
    }

    const sellingValue = units * effectivePrice;
    const costValue = units * unitCost;

    totalUnits += units;
    totalSellingValue += sellingValue;
    totalCostValue += costValue;

    if (units <= 0) {
      outOfStockCount++;
    } else if (units <= 5) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  }

  const potentialGrossProfit = totalSellingValue - totalCostValue;

  return {
    totalUnits,
    totalSellingValue,
    totalCostValue,
    potentialGrossProfit,
    lowStockCount,
    outOfStockCount,
    inStockCount,
  };
}

/**
 * Standard PKR currency formatter
 */
export function formatPKR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}
