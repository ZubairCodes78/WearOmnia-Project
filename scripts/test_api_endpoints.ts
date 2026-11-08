import { POST as createOrder } from '../app/api/orders/route';
import { GET as getPaymentMethods } from '../app/api/payment-methods/route';
import { GET as getPreOrderSettings } from '../app/api/preorder-settings/route';
import { POST as resubmitScreenshot } from '../app/api/preorder/resubmit-screenshot/route';
import { prisma } from '../lib/prisma';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function testApiEndpoints() {
  console.log('====================================================');
  console.log('TESTING API ENDPOINTS DIRECTLY');
  console.log('====================================================\n');

  // Ensure a test screenshot exists via savePaymentProof
  const { savePaymentProof } = await import('../lib/storage');
  const sampleProofRes = await savePaymentProof(Buffer.from('FAKE_PNG_BINARY_DATA'), 'image/png');
  if (!sampleProofRes.success || !sampleProofRes.filename) {
    throw new Error('Failed to create sample payment proof: ' + sampleProofRes.error);
  }
  const testProofFilename = sampleProofRes.filename;
  console.log(`Created sample payment proof: ${testProofFilename}`);

  // 1. Test GET /api/payment-methods
  console.log('\n--- 1. Testing GET /api/payment-methods ---');
  const paymentMethodsRes = await getPaymentMethods();
  const paymentMethodsData = await paymentMethodsRes.json();
  console.log(`Payment methods response status: ${paymentMethodsRes.status}`);
  console.log(`fullAdvanceEnabled: ${paymentMethodsData.fullAdvanceEnabled}`);
  console.log(`Active methods count: ${paymentMethodsData.paymentMethods?.length}`);
  if (paymentMethodsRes.status !== 200 || !paymentMethodsData.fullAdvanceEnabled) {
    throw new Error('GET /api/payment-methods failed');
  }

  // 2. Test GET /api/preorder-settings
  console.log('\n--- 2. Testing GET /api/preorder-settings ---');
  const preOrderSettingsRes = await getPreOrderSettings();
  const preOrderSettingsData = await preOrderSettingsRes.json();
  console.log(`preOrderSettings response status: ${preOrderSettingsRes.status}`);
  console.log(`fullAdvanceEnabled: ${preOrderSettingsData.fullAdvanceEnabled}`);
  if (preOrderSettingsRes.status !== 200 || !preOrderSettingsData.fullAdvanceEnabled) {
    throw new Error('GET /api/preorder-settings failed');
  }

  // Find an active payment method
  const activeMethod = paymentMethodsData.paymentMethods[0];
  if (!activeMethod) {
    throw new Error('No active payment method found');
  }

  // Find a product
  const product = await prisma.product.findFirst({
    where: { isPreOrder: false },
    include: { variants: true },
  });
  if (!product || !product.variants.length) {
    throw new Error('No regular product found');
  }
  const variant = product.variants[0];

  // 3. Test POST /api/orders without screenshot (must fail with 400)
  console.log('\n--- 3. Testing POST /api/orders missing screenshot validation ---');
  const invalidOrderReq = new Request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Validation Tester',
      customerPhone: '03001112233',
      shippingAddress: 'Test Address',
      shippingCity: 'Lahore',
      shippingProvince: 'Punjab',
      paymentMethod: 'FULL_ADVANCE',
      items: [
        {
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          quantity: 1,
          price: product.basePrice || 5000,
        },
      ],
      // Missing screenshotKey and selectedPaymentMethodId
    }),
  });
  const invalidRes = await createOrder(invalidOrderReq as any);
  const invalidData = await invalidRes.json();
  console.log(`Invalid order response status: ${invalidRes.status} (Expected 400)`);
  console.log(`Error message: ${invalidData.error}`);
  if (invalidRes.status !== 400) {
    throw new Error('Missing screenshot should return 400');
  }

  // 4. Test POST /api/orders with valid Full Advance data
  console.log('\n--- 4. Testing POST /api/orders with valid Full Advance data ---');
  const uniquePhone = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
  const validOrderReq = new Request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'API Endpoint Tester',
      phone: uniquePhone,
      address: 'Valid Test Address',
      city: 'Karachi',
      province: 'Sindh',
      postalCode: '75000',
      paymentMethod: 'FULL_ADVANCE',
      selectedPaymentMethodId: activeMethod.id,
      screenshotKey: testProofFilename,
      items: [
        {
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          quantity: 1,
          price: product.basePrice || 5000,
        },
      ],
    }),
  });
  const validRes = await createOrder(validOrderReq as any);
  const validData = await validRes.json();
  console.log(`Valid order response status: ${validRes.status} (Expected 200)`);
  if (!validRes.ok) {
    console.error('Valid order failed with body:', validData);
  }
  console.log(`Order Number: ${validData.orderNumber}`);
  console.log(`Order ID: ${validData.orderId}`);

  if (validRes.status !== 200 || !validData.orderId || !validData.orderNumber) {
    throw new Error('Valid order creation failed');
  }

  // Fetch created order from DB to verify exact values
  const dbOrder = await prisma.order.findUnique({
    where: { id: validData.orderId },
  });

  if (!dbOrder) {
    throw new Error('Created order not found in database');
  }

  console.log(`DB Order Status: ${dbOrder.status} (Expected PAYMENT_REVIEW_PENDING)`);
  console.log(`DB Order isPreOrder: ${dbOrder.isPreOrder} (Expected false)`);
  console.log(`DB Order Payment Method: ${dbOrder.paymentMethod} (Expected FULL_ADVANCE)`);
  console.log(`DB Order preOrderAdvancePercent: ${dbOrder.preOrderAdvancePercent} (Expected 100)`);
  console.log(`DB Order preOrderRemainingAmount: ${dbOrder.preOrderRemainingAmount} (Expected 0)`);

  if (
    dbOrder.status !== 'PAYMENT_REVIEW_PENDING' ||
    dbOrder.isPreOrder !== false ||
    dbOrder.paymentMethod !== 'FULL_ADVANCE' ||
    dbOrder.preOrderAdvancePercent !== 100 ||
    dbOrder.preOrderRemainingAmount !== 0
  ) {
    throw new Error('Database order fields do not match expected Full Advance values');
  }

  const createdOrderId = validData.orderId;
  const createdOrderNumber = validData.orderNumber;

  // 5. Test POST /api/preorder/resubmit-screenshot for this regular order
  console.log('\n--- 5. Testing POST /api/preorder/resubmit-screenshot on regular order ---');
  const resubmitReq = new Request('http://localhost:3000/api/preorder/resubmit-screenshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: createdOrderNumber,
      phone: uniquePhone,
      screenshotKey: testProofFilename,
    }),
  });
  const resubmitRes = await resubmitScreenshot(resubmitReq as any);
  const resubmitData = await resubmitRes.json();
  console.log(`Resubmit status: ${resubmitRes.status}`);
  console.log(`Resubmit message: ${resubmitData.message}`);
  if (resubmitRes.status !== 200) {
    throw new Error('Resubmission on regular full advance order failed');
  }

  // Cleanup created order
  console.log('\nCleaning up created test order...');
  await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } });
  await prisma.adminNotification.deleteMany({ where: { orderId: createdOrderId } });
  await prisma.order.delete({ where: { id: createdOrderId } });

  console.log('\n====================================================');
  console.log('ALL API ENDPOINT TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('====================================================\n');
}

testApiEndpoints()
  .catch((e) => {
    console.error('API endpoint test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
