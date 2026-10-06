import { calculateDiscountPercent, getProductDiscountPercent, getEffectiveSellingPrice } from '../lib/pricing';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('================================================================');
console.log('  WEAROMNIA DISCOUNT PERCENTAGE & PRICING VERIFICATION SUITE');
console.log('================================================================\n');

console.log('--- Phase 1: User Explicit Test Cases ---');
// 4500 -> 4000 = 11% OFF
assert(calculateDiscountPercent(4500, 4000) === 11, '4500 -> 4000 = 11% OFF');
// 4500 -> 3500 = 22% OFF
assert(calculateDiscountPercent(4500, 3500) === 22, '4500 -> 3500 = 22% OFF');
// 5000 -> 3500 = 30% OFF
assert(calculateDiscountPercent(5000, 3500) === 30, '5000 -> 3500 = 30% OFF');

console.log('\n--- Phase 2: Rounding & Step Discounts (10%, 20%, 30%, 50%) ---');
// 10%
assert(calculateDiscountPercent(10000, 9000) === 10, '10000 -> 9000 = 10% OFF');
// 20%
assert(calculateDiscountPercent(5000, 4000) === 20, '5000 -> 4000 = 20% OFF');
// 25%
assert(calculateDiscountPercent(4000, 3000) === 25, '4000 -> 3000 = 25% OFF');
// 50%
assert(calculateDiscountPercent(6000, 3000) === 50, '6000 -> 3000 = 50% OFF');

console.log('\n--- Phase 3: No Discount & Zero/Negative Conditions ---');
// original == selling
assert(calculateDiscountPercent(4500, 4500) === 0, '4500 -> 4500 = 0% (no discount)');
// original < selling (selling price higher than base)
assert(calculateDiscountPercent(4000, 4500) === 0, '4000 -> 4500 = 0% (selling price higher)');
// no selling price
assert(calculateDiscountPercent(4500, null) === 0, '4500 -> null = 0%');
assert(calculateDiscountPercent(4500, undefined) === 0, '4500 -> undefined = 0%');
assert(calculateDiscountPercent(0, 0) === 0, '0 -> 0 = 0%');
assert(calculateDiscountPercent(-100, 50) === 0, 'Negative price = 0%');

console.log('\n--- Phase 4: Product Object Helper (getProductDiscountPercent) ---');
const prod1 = { basePrice: 4500, discountPrice: 4000 };
assert(getProductDiscountPercent(prod1) === 11, 'Product 4500/4000 has 11% OFF');

const prod2 = { basePrice: 4500, discountPrice: 3500 };
assert(getProductDiscountPercent(prod2) === 22, 'Product 4500/3500 has 22% OFF');

const prodNoDiscount = { basePrice: 4500, discountPrice: null };
assert(getProductDiscountPercent(prodNoDiscount) === 0, 'Product without discount price has 0% OFF');

const prodSamePrice = { basePrice: 4500, discountPrice: 4500 };
assert(getProductDiscountPercent(prodSamePrice) === 0, 'Product with equal discount price has 0% OFF');

const prodHigherPrice = { basePrice: 4500, discountPrice: 5000 };
assert(getProductDiscountPercent(prodHigherPrice) === 0, 'Product with higher discount price has 0% OFF');

console.log('\n================================================================');
console.log('🎯 ALL DISCOUNT TESTS PASSED ACCORDING TO SPECIFICATION!');
console.log('================================================================');
