import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runQATests() {
  console.log('🧪 Starting WearOMNIA Comprehensive QA Testing Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details || ''}`);
      failedCount++;
    }
  }

  try {
    // Test 1: Verify Flagship Launch Product
    const productCount = await prisma.product.count();
    assert(productCount >= 1, 'Database Flagship Launch Product Populated', `Found ${productCount} flagship product`);

    // Test 2: Verify Categories and Collections (New Arrivals Launch)
    const categoryCount = await prisma.category.count();
    const collectionCount = await prisma.collection.count();
    assert(categoryCount >= 1, 'New Arrivals Category Configured', `Found ${categoryCount} category`);
    assert(collectionCount >= 1, 'New Arrivals Collection Configured', `Found ${collectionCount} collection`);

    // Test 3: Verify Shipping Rules & PK Cities
    const shippingRulesCount = await prisma.shippingRule.count();
    assert(shippingRulesCount >= 8, 'Pakistan Shipping Rules Configured', `Found ${shippingRulesCount} city rules`);

    // Test 4: Verify Coupon Validation Logic
    const coupon = await prisma.coupon.findUnique({ where: { code: 'WELCOME10' } });
    assert(!!coupon && coupon.isActive, 'Coupon WELCOME10 Active', 'WELCOME10 promo code found');

    let calculatedDiscount = 0;
    if (coupon) {
      const subtotal = 20000;
      calculatedDiscount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
      assert(calculatedDiscount === 2000, 'Coupon Discount Calculation', `Expected 2000, got ${calculatedDiscount}`);
    }

    // Test 5: End-to-End Guest Order Placement Simulation
    console.log('\n--- Testing Guest Checkout Order Placement ---');
    const testPhone = '0399' + Math.floor(1000000 + Math.random() * 9000000);
    const testCustomer = await prisma.customer.create({
      data: {
        fullName: 'QA Test Customer',
        phone: testPhone,
        whatsapp: testPhone,
        email: 'qa.test@wearomnia.com',
        province: 'Punjab',
        city: 'Lahore',
        address: 'QA Test Suite House #1, M.M. Alam Road',
        totalSpent: 24900,
        ordersCount: 1,
        averageOrderValue: 24900,
      },
    });
    assert(!!testCustomer.id, 'Customer Record Auto-Creation', `Customer ID: ${testCustomer.id}`);

    const testOrderNumber = 'OMNIA-QA-' + Math.floor(1000 + Math.random() * 9000);
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        customerId: testCustomer.id,
        customerName: testCustomer.fullName,
        customerPhone: testCustomer.phone,
        shippingProvince: 'Punjab',
        shippingCity: 'Lahore',
        shippingAddress: testCustomer.address!,
        subtotal: 24900,
        discountAmount: 0,
        shippingFee: 0,
        totalAmount: 24900,
        paymentMethod: 'CASH_ON_DELIVERY',
        status: 'PENDING',
        items: {
          create: [
            {
              productTitle: 'The Sovereign Velvet Kaftan',
              variantInfo: 'Size: M, Color: Deep Teal',
              unitPrice: 24900,
              quantity: 1,
              subtotal: 24900,
            },
          ],
        },
        timeline: {
          create: {
            status: 'PENDING',
            note: 'QA Test Order Created',
            updatedBy: 'QA Test Runner',
          },
        },
      },
      include: { items: true, timeline: true },
    });
    assert(!!testOrder.id && testOrder.orderNumber === testOrderNumber, 'Order Database Insertion', `Order Number: ${testOrder.orderNumber}`);
    assert(testOrder.items.length === 1, 'Order Items Relation', `Items count: ${testOrder.items.length}`);
    assert(testOrder.timeline.length === 1, 'Order Timeline Tracking', `Timeline count: ${testOrder.timeline.length}`);

    // Test 6: Verify Admin Status Transition & Timeline Update
    const updatedOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: {
        status: 'CONFIRMED',
        trackingNumber: 'TCS-QA-99124',
        timeline: {
          create: {
            status: 'CONFIRMED',
            previousStatus: 'PENDING',
            note: 'Order confirmed by admin call',
            updatedBy: 'Admin QA',
          },
        },
      },
      include: { timeline: true },
    });
    assert(updatedOrder.status === 'CONFIRMED', 'Order Status Transition (PENDING -> CONFIRMED)', `New Status: ${updatedOrder.status}`);
    assert(updatedOrder.timeline.length === 2, 'Order Timeline Historical Audit', `Timeline records: ${updatedOrder.timeline.length}`);

    // Test 7: Verify Inventory Log Recording
    const inventoryLog = await prisma.inventoryLog.create({
      data: {
        productId: (await prisma.product.findFirst())?.id || 'prod-1',
        changeQuantity: -1,
        stockAfter: 24,
        reason: 'ORDER_PLACED',
      },
    });
    assert(!!inventoryLog.id, 'Inventory Movement Audit Log', `Log ID: ${inventoryLog.id}`);

    // Test 8: Verify Security Audit Log Recording
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'QA_TEST_RUN',
        entity: 'TestSuite',
        details: 'Verified database persistence and audit trails',
      },
    });
    assert(!!auditLog.id, 'Security Audit Log Recording', `Audit ID: ${auditLog.id}`);

    // Test 9: Verify Product Review Moderation Flow
    const review = await prisma.review.create({
      data: {
        productId: (await prisma.product.findFirst())?.id || 'prod-1',
        customerName: 'QA Reviewer',
        rating: 5,
        comment: 'QA Test review submission',
        isApproved: false,
      },
    });
    assert(review.isApproved === false, 'Review Pending State', 'Review is initially unapproved');

    const approvedReview = await prisma.review.update({
      where: { id: review.id },
      data: { isApproved: true },
    });
    assert(approvedReview.isApproved === true, 'Review Approval Flow', 'Review successfully approved');

    // Clean up test data
    await prisma.review.delete({ where: { id: review.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.orderTimeline.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });
    console.log('\n🧹 QA Test Cleaned up transient test records.');

    console.log(`\n==============================================`);
    console.log(`📊 QA TEST RESULT: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log(`==============================================\n`);
  } catch (error) {
    console.error('❌ QA Test exception:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runQATests();
