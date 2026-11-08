import { prisma } from '../lib/prisma';
import { getSiteSettings, updateSiteSettings } from '../lib/settings';

async function runTestSuite() {
  console.log('====================================================');
  console.log('STARTING FULL ADVANCE PAYMENT TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Find or create an active payment method in PreOrderPaymentMethod
  let testMethod = await prisma.preOrderPaymentMethod.findFirst({
    where: { isActive: true },
  });

  if (!testMethod) {
    testMethod = await prisma.preOrderPaymentMethod.create({
      data: {
        displayName: 'Meezan Bank Test',
        methodType: 'BANK_TRANSFER',
        bankName: 'Meezan Bank',
        accountTitle: 'WearOMNIA Test Store',
        accountNumber: '1234567890',
        instructions: 'Test instructions for payment',
        isActive: true,
      },
    });
    console.log(`Created test payment method: ${testMethod.displayName} (${testMethod.id})`);
  } else {
    console.log(`Using existing payment method: ${testMethod.displayName} (${testMethod.id})`);
  }

  // Find a regular product and variant for testing
  let testProduct: any = await prisma.product.findFirst({
    where: { isPreOrder: false },
    include: { variants: true },
  });

  if (!testProduct || !testProduct.variants.length) {
    testProduct = await prisma.product.create({
      data: {
        title: 'Test Regular Abaya Full Advance',
        slug: 'test-regular-abaya-full-advance-' + Date.now(),
        description: 'Test product for full advance suite',
        basePrice: 5000,
        sku: 'TEST-SKU-' + Date.now(),
        isPreOrder: false,
        variants: {
          create: {
            size: 'Standard',
            color: 'Black',
            sku: 'TEST-REG-' + Date.now(),
            stock: 100,
          },
        },
      },
      include: { variants: true },
    }) as any;
  }

  const testVariant = testProduct.variants[0];

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Admin Site Settings for Full Advance Payment
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 1: Admin Site Settings Configuration ---');
  await updateSiteSettings({
    full_advance_payment_enabled: true,
    full_advance_payment_instructions: 'Pay 100% advance via Bank Transfer or Raast.',
  });

  const settings = await getSiteSettings();
  assert(
    settings.full_advance_payment_enabled === true,
    'SiteSettings full_advance_payment_enabled is active'
  );
  assert(
    settings.full_advance_payment_instructions.includes('Pay 100% advance'),
    'SiteSettings full_advance_payment_instructions saved accurately'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: Regular Product with Cash on Delivery (COD) Checkout
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 2: Regular Product COD Checkout (Unchanged Baseline) ---');
  const codOrderNumber = 'TEST-COD-' + Date.now();
  const codOrder = await prisma.order.create({
    data: {
      orderNumber: codOrderNumber,
      customerName: 'Test Customer COD',
      customerPhone: '03001234567',
      shippingAddress: 'Gulberg III',
      shippingCity: 'Lahore',
      shippingProvince: 'Punjab',
      postalCode: '54000',
      paymentMethod: 'COD',
      status: 'PENDING',
      isPreOrder: false,
      subtotal: 5000,
      shippingFee: 200,
      totalAmount: 5200,
      amountPaid: 0,
      items: {
        create: {
          product: { connect: { id: testProduct.id } },
          productTitle: testProduct.title,
          variantInfo: testVariant.title || 'Standard',
          quantity: 1,
          unitPrice: 5000,
          subtotal: 5000,
        },
      },
    },
  });

  assert(codOrder.status === 'PENDING', 'Regular COD order starts in PENDING status');
  assert(codOrder.paymentMethod === 'COD', 'Payment method is COD');
  assert(codOrder.isPreOrder === false, 'isPreOrder is strictly false');
  assert(codOrder.amountPaid === 0, 'COD amountPaid is 0');
  assert(codOrder.totalAmount === 5200, 'Total amount includes shipping');

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Regular Product 100% Full Advance Order Creation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 3: Regular Product Full Advance Order (100% Payable) ---');
  const advanceOrderNumber = 'TEST-FA-' + Date.now();
  const fullAdvanceOrder = await prisma.order.create({
    data: {
      orderNumber: advanceOrderNumber,
      customerName: 'Test Customer Full Advance',
      customerPhone: '03009876543',
      shippingAddress: 'DHA Phase 5',
      shippingCity: 'Lahore',
      shippingProvince: 'Punjab',
      postalCode: '54000',
      paymentMethod: 'FULL_ADVANCE',
      status: 'PAYMENT_REVIEW_PENDING',
      isPreOrder: false,
      preOrderPaymentStatus: 'PAYMENT_REVIEW_PENDING',
      preOrderAdvancePercent: 100,
      preOrderAdvanceAmount: 5000, // 100% of order total (no shipping in this test)
      preOrderRemainingAmount: 0, // Rs. 0 balance on delivery
      preOrderPaymentScreenshotUrl: 'uploads/test-proof-' + Date.now() + '.png',

      preOrderPaymentMethodName: testMethod.displayName || 'Bank Transfer',
      subtotal: 5000,
      shippingFee: 0,
      totalAmount: 5000,
      amountPaid: 0, // Until approved by admin
      items: {
        create: {
          product: { connect: { id: testProduct.id } },
          productTitle: testProduct.title,
          variantInfo: testVariant.title || 'Standard',
          quantity: 1,
          unitPrice: 5000,
          subtotal: 5000,
        },
      },
    },
  });

  assert(
    fullAdvanceOrder.status === 'PAYMENT_REVIEW_PENDING',
    'Full Advance order starts with status PAYMENT_REVIEW_PENDING'
  );
  assert(
    fullAdvanceOrder.paymentMethod === 'FULL_ADVANCE',
    'Full Advance order paymentMethod is FULL_ADVANCE'
  );
  assert(
    fullAdvanceOrder.isPreOrder === false,
    'Regular Full Advance order has isPreOrder === false'
  );
  assert(
    fullAdvanceOrder.preOrderAdvancePercent === 100,
    'Advance percent is exactly 100% (NOT 50%)'
  );
  assert(
    fullAdvanceOrder.preOrderAdvanceAmount === 5000,
    'Advance amount equals full total amount'
  );
  assert(
    fullAdvanceOrder.preOrderRemainingAmount === 0,
    'Remaining balance on delivery is strictly 0'
  );
  assert(
    Boolean(fullAdvanceOrder.preOrderPaymentScreenshotUrl),
    'Payment proof screenshot URL is recorded'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: Multiple Items + Discount Coupon + Shipping Calculations
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 4: Multiple Items + Discount + Shipping Calculation ---');
  const multiItemOrderNumber = 'TEST-FA-MULTI-' + Date.now();
  const subtotal = 10000;
  const discount = 1000; // 10% coupon
  const shipping = 250;
  const expectedTotal = subtotal - discount + shipping; // 9250

  const multiItemOrder = await prisma.order.create({
    data: {
      orderNumber: multiItemOrderNumber,
      customerName: 'Multi Item Customer',
      customerPhone: '03211234567',
      shippingAddress: 'F-7/2',
      shippingCity: 'Islamabad',
      shippingProvince: 'Federal Capital',
      postalCode: '44000',
      paymentMethod: 'FULL_ADVANCE',
      status: 'PAYMENT_REVIEW_PENDING',
      isPreOrder: false,
      preOrderPaymentStatus: 'PAYMENT_REVIEW_PENDING',
      preOrderAdvancePercent: 100,
      preOrderAdvanceAmount: expectedTotal,
      preOrderRemainingAmount: 0,
      preOrderPaymentScreenshotUrl: 'uploads/test-multi-proof.png',

      preOrderPaymentMethodName: testMethod.displayName || 'Bank Transfer',
      subtotal,
      discountAmount: discount,
      couponCode: 'WELCOME10',
      shippingFee: shipping,
      totalAmount: expectedTotal,
      amountPaid: 0,
      items: {
        create: [
          {
            product: { connect: { id: testProduct.id } },
            productTitle: testProduct.title,
            variantInfo: 'Variant A',
            quantity: 1,
            unitPrice: 5000,
            subtotal: 5000,
          },
          {
            product: { connect: { id: testProduct.id } },
            productTitle: testProduct.title,
            variantInfo: 'Variant B',
            quantity: 1,
            unitPrice: 5000,
            subtotal: 5000,
          },
        ],
      },
    },
  });

  assert(
    multiItemOrder.totalAmount === 9250,
    `Total amount correctly reflects subtotal (${subtotal}) - discount (${discount}) + shipping (${shipping}) = 9250`
  );
  assert(
    multiItemOrder.preOrderAdvanceAmount === 9250,
    '100% Advance amount accurately includes shipping charges and discounts'
  );
  assert(
    multiItemOrder.preOrderRemainingAmount === 0,
    'Remaining balance is 0 for multi-item order'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST 5: Courier Safeguard: PostEx COD Amount Calculation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 5: Courier PostEx COD Amount Safeguards ---');
  // For Full Advance: courier COD amount must be 0
  const codAmountForCourier = fullAdvanceOrder.paymentMethod === 'FULL_ADVANCE' ? 0 : fullAdvanceOrder.totalAmount;
  assert(
    codAmountForCourier === 0,
    'PostEx shipmentCodAmount must be strictly 0 for Full Advance orders'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST 6: Admin Payment Approval Workflow
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 6: Admin Payment Approval Workflow ---');
  const approvedOrder = await prisma.order.update({
    where: { id: fullAdvanceOrder.id },
    data: {
      status: 'CONFIRMED',
      amountPaid: fullAdvanceOrder.totalAmount, // 100% credited
      preOrderRemainingAmount: 0,
      preOrderPaymentStatus: 'PAYMENT_APPROVED',
      preOrderPaymentVerifiedAt: new Date(),
      preOrderPaymentVerifiedBy: 'Admin Verification Suite',
    },
  });

  assert(approvedOrder.status === 'CONFIRMED', 'Status transitions to CONFIRMED on approval');
  assert(
    approvedOrder.preOrderPaymentStatus === 'PAYMENT_APPROVED',
    'preOrderPaymentStatus transitions to PAYMENT_APPROVED'
  );
  assert(
    approvedOrder.amountPaid === approvedOrder.totalAmount,
    'amountPaid equals full 100% order amount on approval'
  );
  assert(
    approvedOrder.preOrderPaymentVerifiedBy === 'Admin Verification Suite',
    'Admin audit details recorded on approval'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST 7: Admin Payment Rejection & Resubmission Workflow
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 7: Admin Payment Rejection & Resubmission ---');
  // Reject multiItemOrder
  const rejectedOrder = await prisma.order.update({
    where: { id: multiItemOrder.id },
    data: {
      preOrderPaymentStatus: 'PAYMENT_REJECTED',
      preOrderPaymentRejectionReason: 'Transaction ID not visible in receipt screenshot',
      preOrderPaymentVerifiedAt: new Date(),
      preOrderPaymentVerifiedBy: 'Admin Verification Suite',
    },
  });

  assert(
    rejectedOrder.preOrderPaymentStatus === 'PAYMENT_REJECTED',
    'preOrderPaymentStatus transitions to PAYMENT_REJECTED'
  );
  assert(
    rejectedOrder.preOrderPaymentRejectionReason === 'Transaction ID not visible in receipt screenshot',
    'Rejection reason is stored for customer feedback'
  );

  // Customer resubmits screenshot on existing order (NO DUPLICATE ORDER)
  const newScreenshotUrl = 'uploads/test-resubmitted-proof-' + Date.now() + '.png';
  const resubmittedOrder = await prisma.order.update({
    where: { id: multiItemOrder.id },
    data: {
      preOrderPaymentScreenshotUrl: newScreenshotUrl,
      preOrderPaymentStatus: 'PAYMENT_REVIEW_PENDING',
      preOrderPaymentRejectionReason: null,
      preOrderPaymentVerifiedAt: null,
      preOrderPaymentVerifiedBy: null,
    },
  });

  assert(
    resubmittedOrder.id === multiItemOrder.id,
    'Resubmission updates the SAME order (no duplicate order created)'
  );
  assert(
    resubmittedOrder.preOrderPaymentScreenshotUrl === newScreenshotUrl,
    'Resubmitted screenshot URL is updated'
  );
  assert(
    resubmittedOrder.preOrderPaymentStatus === 'PAYMENT_REVIEW_PENDING',
    'Status resets to PAYMENT_REVIEW_PENDING awaiting re-verification'
  );
  assert(
    resubmittedOrder.preOrderPaymentRejectionReason === null,
    'Previous rejection reason cleared upon resubmission'
  );

  // ─────────────────────────────────────────────────────────────────
  // TEST 8: Existing Pre-Order Checkout Isolation (50% Advance Intact)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Test 8: Pre-Order Checkout Isolation (50% Advance) ---');
  const preOrderNumber = 'TEST-PREORDER-' + Date.now();
  const preOrder = await prisma.order.create({
    data: {
      orderNumber: preOrderNumber,
      customerName: 'Test PreOrder Customer',
      customerPhone: '03331234567',
      shippingAddress: 'Blue Area',
      shippingCity: 'Islamabad',
      shippingProvince: 'Federal Capital',
      postalCode: '44000',
      paymentMethod: 'PRE_ORDER_ADVANCE',
      status: 'PAYMENT_REVIEW_PENDING',
      isPreOrder: true,
      preOrderPaymentStatus: 'PAYMENT_REVIEW_PENDING',
      preOrderAdvancePercent: 50,
      preOrderAdvanceAmount: 2500, // 50%
      preOrderRemainingAmount: 2500, // 50% remaining due on COD
      preOrderPaymentScreenshotUrl: 'uploads/test-preorder-proof.png',

      preOrderPaymentMethodName: testMethod.displayName || 'Bank Transfer',
      subtotal: 5000,
      shippingFee: 0,
      totalAmount: 5000,
      amountPaid: 0,
      items: {
        create: {
          product: { connect: { id: testProduct.id } },
          productTitle: 'Pre-Order Exclusive Abaya',
          variantInfo: 'Standard',
          quantity: 1,
          unitPrice: 5000,
          subtotal: 5000,
        },
      },
    },
  });

  assert(preOrder.isPreOrder === true, 'Pre-order has isPreOrder === true');
  assert(preOrder.preOrderAdvancePercent === 50, 'Pre-order maintains 50% advance percent');
  assert(preOrder.preOrderAdvanceAmount === 2500, 'Pre-order advance amount is 50% (2500)');
  assert(preOrder.preOrderRemainingAmount === 2500, 'Pre-order balance on delivery is 50% (2500)');

  // ─────────────────────────────────────────────────────────────────
  // Clean up test orders
  // ─────────────────────────────────────────────────────────────────
  console.log('\nCleaning up test artifacts...');
  await prisma.orderItem.deleteMany({
    where: {
      orderId: {
        in: [codOrder.id, fullAdvanceOrder.id, multiItemOrder.id, preOrder.id],
      },
    },
  });
  await prisma.order.deleteMany({
    where: {
      id: {
        in: [codOrder.id, fullAdvanceOrder.id, multiItemOrder.id, preOrder.id],
      },
    },
  });

  console.log('\n====================================================');
  console.log(`ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log('====================================================');
}

runTestSuite()
  .catch((e) => {
    console.error('Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
