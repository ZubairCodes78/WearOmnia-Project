import { prisma } from '../lib/prisma';
import {
  validateCouponServer,
  getCouponScheduleStatus,
  formatKarachiDateTime,
  parseKarachiDateTime,
  calculateDurationDisplay,
} from '../lib/coupons';
import { calculatePreOrderAmounts } from '../lib/preorder';

async function runSchedulingTestSuite() {
  console.log('================================================================');
  console.log('STARTING WEAROMNIA PRE-ORDER COUPON SCHEDULING VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // Ensure PREORDER500 is in the canonical default campaign schedule:
  // Start: 2026-09-29T00:00:00+05:00 (1790622000000)
  // End:   2026-10-20T23:59:59+05:00 (1792522799000)
  const canonicalStart = new Date('2026-09-29T00:00:00+05:00');
  const canonicalEnd = new Date('2026-10-20T23:59:59+05:00');

  await prisma.coupon.upsert({
    where: { code: 'PREORDER500' },
    update: {
      discountType: 'FIXED',
      discountValue: 500,
      minOrderAmount: 0,
      isActive: true,
      startDate: canonicalStart,
      expiryDate: canonicalEnd,
      timezone: 'Asia/Karachi',
      isPreOrderOnly: true,
      autoApply: false,
    },
    create: {
      code: 'PREORDER500',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderAmount: 0,
      isActive: true,
      startDate: canonicalStart,
      expiryDate: canonicalEnd,
      timezone: 'Asia/Karachi',
      isPreOrderOnly: true,
      autoApply: false,
    },
  });

  // TEST 1: Before campaign start (e.g. 28 September 2026 23:59:59 PKT)
  const beforeStart = new Date('2026-09-28T23:59:59+05:00');
  const resBefore = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 10000,
    isPreOrder: true,
    now: beforeStart,
  });
  assert(
    !resBefore.valid && resBefore.status === 'SCHEDULED',
    'Test 1: Before Campaign Start — Rejected server-side as SCHEDULED',
    `Result: ${JSON.stringify(resBefore)}`
  );

  // TEST 2: Exactly at campaign start (29 September 2026 00:00:00 PKT)
  const exactStart = new Date('2026-09-29T00:00:00+05:00');
  const resExactStart = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 10000,
    isPreOrder: true,
    now: exactStart,
  });
  assert(
    resExactStart.valid && resExactStart.status === 'ACTIVE' && resExactStart.calculatedDiscount === 500,
    'Test 2: Exactly at Campaign Start — Accepted server-side as ACTIVE with PKR 500 discount',
    `Result: ${JSON.stringify(resExactStart)}`
  );

  // TEST 3: During campaign (e.g. 10 October 2026 14:30:00 PKT)
  const midCampaign = new Date('2026-10-10T14:30:00+05:00');
  const resMid = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 15000,
    isPreOrder: true,
    now: midCampaign,
  });
  assert(
    resMid.valid && resMid.calculatedDiscount === 500,
    'Test 3: During Campaign — Accepted with PKR 500 discount',
    `Result: ${JSON.stringify(resMid)}`
  );

  // TEST 4: Exactly at campaign end (20 October 2026 23:59:59 PKT)
  const exactEnd = new Date('2026-10-20T23:59:59+05:00');
  const resExactEnd = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 8000,
    isPreOrder: true,
    now: exactEnd,
  });
  assert(
    resExactEnd.valid && resExactEnd.status === 'ACTIVE',
    'Test 4: Exactly at Campaign End (23:59:59 PKT) — Accepted as ACTIVE',
    `Result: ${JSON.stringify(resExactEnd)}`
  );

  // TEST 5: After campaign end (21 October 2026 00:00:00 PKT)
  const afterEnd = new Date('2026-10-21T00:00:00+05:00');
  const resAfter = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 8000,
    isPreOrder: true,
    now: afterEnd,
  });
  assert(
    !resAfter.valid && resAfter.status === 'EXPIRED',
    'Test 5: After Campaign End — Automatically rejected server-side as EXPIRED',
    `Result: ${JSON.stringify(resAfter)}`
  );

  // TEST 6: Admin disables coupon
  await prisma.coupon.update({
    where: { code: 'PREORDER500' },
    data: { isActive: false },
  });
  const resDisabled = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 10000,
    isPreOrder: true,
    now: midCampaign,
  });
  assert(
    !resDisabled.valid && resDisabled.status === 'DISABLED',
    'Test 6: Admin Disables Coupon — Immediately rejected server-side as DISABLED',
    `Result: ${JSON.stringify(resDisabled)}`
  );

  // Re-enable coupon
  await prisma.coupon.update({
    where: { code: 'PREORDER500' },
    data: { isActive: true },
  });

  // TEST 7: Admin changes campaign start/end schedule dates in DB
  // Move campaign to start on 1 October 2026
  const newStart = new Date('2026-10-01T00:00:00+05:00');
  await prisma.coupon.update({
    where: { code: 'PREORDER500' },
    data: { startDate: newStart },
  });
  const resRescheduled = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 10000,
    isPreOrder: true,
    now: new Date('2026-09-30T12:00:00+05:00'),
  });
  assert(
    !resRescheduled.valid && resRescheduled.status === 'SCHEDULED',
    'Test 7: Admin Reschedules Start Date — Server immediately rejects attempts prior to new start date',
    `Result: ${JSON.stringify(resRescheduled)}`
  );

  // Restore canonical start date
  await prisma.coupon.update({
    where: { code: 'PREORDER500' },
    data: { startDate: canonicalStart },
  });

  // TEST 8: 50% Advance calculation AFTER coupon discount
  // Item subtotal: PKR 10,000, Shipping: 0, Coupon discount: PKR 500
  // Net Total = PKR 9,500. Advance (50%) = PKR 4,750. Remaining = PKR 4,750.
  const subtotal = 10000;
  const couponDiscount = 500;
  const netTotal = subtotal - couponDiscount;
  const { advanceAmount, remainingAmount } = calculatePreOrderAmounts(netTotal, 50);

  assert(
    advanceAmount === 4750 && remainingAmount === 4750 && (advanceAmount + remainingAmount) === netTotal,
    'Test 8: 50% Advance is strictly calculated AFTER coupon discount (4,750 advance on 9,500 net)',
    `Advance: ${advanceAmount}, Remaining: ${remainingAmount}, NetTotal: ${netTotal}`
  );

  // TEST 9: Pre-Order exclusivity validation (rejected if in-stock / standard cart)
  const resNonPreOrder = await validateCouponServer({
    code: 'PREORDER500',
    subtotal: 10000,
    isPreOrder: false,
    now: midCampaign,
  });
  assert(
    !resNonPreOrder.valid && Boolean(resNonPreOrder.error?.includes('pre-order')),
    'Test 9: Pre-order exclusive coupon rejected when order is not a pre-order',
    `Result: ${JSON.stringify(resNonPreOrder)}`
  );

  // TEST 10: Formatting & Duration Calculation in Asia/Karachi
  const duration = calculateDurationDisplay(canonicalStart, canonicalEnd);
  assert(
    duration.includes('21 Day') && duration.includes('23 Hr'),
    `Test 10: Campaign duration correctly calculates as 21 Days, 23 Hours (Got: "${duration}")`,
    duration
  );

  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSchedulingTestSuite()
  .catch((err) => {
    console.error('Test suite uncaught error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
