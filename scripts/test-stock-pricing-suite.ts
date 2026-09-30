/**
 * WearOMNIA Inventory & Stock Pricing Verification Suite
 *
 * Tests the canonical pricing engine, stock valuation logic, cost price separation,
 * coupon handling, order analytics, and inventory movement rules.
 */

import {
  calculateStockValuation,
  calculateInventoryTotals,
  getEffectiveSellingPrice,
  getProductDiscountAmount,
  formatPKR,
} from '../lib/pricing';

interface TestCaseResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  details?: string;
}

const results: TestCaseResult[] = [];

function assertEqual(testName: string, actual: any, expected: any, details?: string) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name: testName, passed, expected, actual, details });
  if (passed) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  WEAROMNIA INVENTORY & STOCK PRICING TEST SUITE');
  console.log('================================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // EXACT USER TEST CASES
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- Phase 1: Exact Mandated User Test Cases ---');

  // CASE 1:
  // Original = 4500, Sale = 4000, Stock = 10, Cost = 2200
  // Expected: Stock Selling Value = 40,000 | Stock Cost Value = 22,000 | Potential Gross Profit = 18,000
  const case1 = calculateStockValuation({
    basePrice: 4500,
    discountPrice: 4000,
    stockQuantity: 10,
    costPrice: 2200,
  });
  assertEqual('Case 1 - Stock Selling Value', case1.stockSellingValue, 40000);
  assertEqual('Case 1 - Stock Cost Value', case1.stockCostValue, 22000);
  assertEqual('Case 1 - Potential Gross Profit', case1.potentialGrossProfit, 18000);
  assertEqual('Case 1 - Effective Selling Price', case1.effectiveSellingPrice, 4000);
  assertEqual('Case 1 - Discount Amount', case1.discountAmount, 500);

  // CASE 2:
  // Original = 4500, Sale = 4500, Stock = 10, Cost = 2200
  // Expected: Stock Selling Value = 45,000 | Stock Cost Value = 22,000 | Potential Gross Profit = 23,000
  const case2 = calculateStockValuation({
    basePrice: 4500,
    discountPrice: 4500,
    stockQuantity: 10,
    costPrice: 2200,
  });
  assertEqual('Case 2 - Stock Selling Value', case2.stockSellingValue, 45000);
  assertEqual('Case 2 - Stock Cost Value', case2.stockCostValue, 22000);
  assertEqual('Case 2 - Potential Gross Profit', case2.potentialGrossProfit, 23000);
  assertEqual('Case 2 - Effective Selling Price', case2.effectiveSellingPrice, 4500);
  assertEqual('Case 2 - Discount Amount', case2.discountAmount, 0);

  // CASE 3:
  // Original = 5000, Sale = 4000, Stock = 5, Cost = 2500
  // Expected: Stock Selling Value = 20,000 | Stock Cost Value = 12,500 | Potential Gross Profit = 7,500
  const case3 = calculateStockValuation({
    basePrice: 5000,
    discountPrice: 4000,
    stockQuantity: 5,
    costPrice: 2500,
  });
  assertEqual('Case 3 - Stock Selling Value', case3.stockSellingValue, 20000);
  assertEqual('Case 3 - Stock Cost Value', case3.stockCostValue, 12500);
  assertEqual('Case 3 - Potential Gross Profit', case3.potentialGrossProfit, 7500);
  assertEqual('Case 3 - Effective Selling Price', case3.effectiveSellingPrice, 4000);
  assertEqual('Case 3 - Discount Amount', case3.discountAmount, 1000);

  // ───────────────────────────────────────────────────────────────────────────
  // EDGE CASES & PRODUCT SCENARIOS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Phase 2: Edge Cases & Scenarios ---');

  // Zero stock
  const zeroStock = calculateStockValuation({
    basePrice: 4500,
    discountPrice: 4000,
    stockQuantity: 0,
    costPrice: 2200,
  });
  assertEqual('Zero Stock - Selling Value is 0', zeroStock.stockSellingValue, 0);
  assertEqual('Zero Stock - Cost Value is 0', zeroStock.stockCostValue, 0);
  assertEqual('Zero Stock - Potential Profit is 0', zeroStock.potentialGrossProfit, 0);

  // Negative / Out-of-Stock (Stock = -3)
  const outOfStock = calculateStockValuation({
    basePrice: 4500,
    discountPrice: 4000,
    stockQuantity: -3,
    costPrice: 2200,
  });
  assertEqual('Out of Stock - Clamped to 0 units', outOfStock.stockQuantity, 0);
  assertEqual('Out of Stock - Selling Value is 0', outOfStock.stockSellingValue, 0);

  // Low stock (Stock = 3)
  const lowStock = calculateStockValuation({
    basePrice: 6000,
    discountPrice: 4800,
    stockQuantity: 3,
    costPrice: 2400,
  });
  assertEqual('Low Stock - Selling Value', lowStock.stockSellingValue, 14400); // 3 * 4800
  assertEqual('Low Stock - Cost Value', lowStock.stockCostValue, 7200);       // 3 * 2400
  assertEqual('Low Stock - Gross Profit', lowStock.potentialGrossProfit, 7200); // 3 * (4800 - 2400)

  // Product without discount (discountPrice is null)
  const noDiscount = calculateStockValuation({
    basePrice: 3500,
    discountPrice: null,
    stockQuantity: 8,
    costPrice: 1800,
  });
  assertEqual('No Discount - Effective Price is Base Price', noDiscount.effectiveSellingPrice, 3500);
  assertEqual('No Discount - Selling Value', noDiscount.stockSellingValue, 28000);
  assertEqual('No Discount - Cost Value', noDiscount.stockCostValue, 14400);
  assertEqual('No Discount - Gross Profit', noDiscount.potentialGrossProfit, 13600);

  // Multi-product Catalog Aggregate Valuation
  const catalog = [
    { basePrice: 4500, discountPrice: 4000, stockQuantity: 10, costPrice: 2200 },
    { basePrice: 4500, discountPrice: 4500, stockQuantity: 10, costPrice: 2200 },
    { basePrice: 5000, discountPrice: 4000, stockQuantity: 5, costPrice: 2500 },
    { basePrice: 3500, discountPrice: null, stockQuantity: 0, costPrice: 1500 },
  ];
  const catalogTotals = calculateInventoryTotals(catalog);
  assertEqual('Catalog Totals - Total Units', catalogTotals.totalUnits, 25);
  assertEqual('Catalog Totals - Total Selling Value', catalogTotals.totalSellingValue, 40000 + 45000 + 20000 + 0); // 105,000
  assertEqual('Catalog Totals - Total Cost Value', catalogTotals.totalCostValue, 22000 + 22000 + 12500 + 0);    // 56,500
  assertEqual('Catalog Totals - Potential Gross Profit', catalogTotals.potentialGrossProfit, 105000 - 56500);   // 48,500
  assertEqual('Catalog Totals - Out of Stock Count', catalogTotals.outOfStockCount, 1);
  assertEqual('Catalog Totals - Low Stock Count', catalogTotals.lowStockCount, 1); // 5 units

  // Multi-variant Product Stock Valuation
  const variantProduct = {
    basePrice: 8000,
    discountPrice: 7000,
    stockQuantity: 0, // Ignored because variants exist
    costPrice: 3500,
    variants: [
      { stock: 4 }, // Small
      { stock: 6 }, // Medium
      { stock: 2 }, // Large
    ],
  };
  const variantTotals = calculateInventoryTotals([variantProduct]);
  assertEqual('Variant Product - Total Units from variants', variantTotals.totalUnits, 12);
  assertEqual('Variant Product - Total Selling Value', variantTotals.totalSellingValue, 12 * 7000); // 84,000
  assertEqual('Variant Product - Total Cost Value', variantTotals.totalCostValue, 12 * 3500);       // 42,000
  assertEqual('Variant Product - Potential Profit', variantTotals.potentialGrossProfit, 42000);

  // ───────────────────────────────────────────────────────────────────────────
  // ORDER PRICING & COUPON RULES
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Phase 3: Order Pricing & Coupon Separation ---');

  // Verify that product stock selling value does NOT arbitrarily deduct customer coupons
  // But order final value correctly uses: subtotal - couponDiscount + shippingFee
  const productA = { basePrice: 4500, discountPrice: 4000 };
  const stockValuationWithNoCouponDeduction = calculateStockValuation({
    ...productA,
    stockQuantity: 10,
    costPrice: 2000,
  });
  assertEqual(
    'Coupon Rule - Stock selling value uses product effective price, not customer coupon',
    stockValuationWithNoCouponDeduction.stockSellingValue,
    40000
  );

  // Order calculation test
  const orderItems = [
    { basePrice: 4500, price: getEffectiveSellingPrice(productA), quantity: 2 }, // 2 * 4000 = 8000
  ];
  const orderSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = 500;
  const shippingFee = 250;
  const finalOrderTotal = Math.max(0, orderSubtotal - couponDiscount + shippingFee);

  assertEqual('Order Subtotal uses effective selling price', orderSubtotal, 8000);
  assertEqual('Final Order Total incorporates coupon and shipping', finalOrderTotal, 7750); // 8000 - 500 + 250

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  if (allPassed) {
    console.log('🎯 ALL INVENTORY & STOCK PRICING TESTS PASSED PERFECTLY!');
  } else {
    console.error('⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal error running stock test suite:', e);
  process.exit(1);
});
