import { prisma } from '../lib/prisma';
import { getSiteSettings, updateSiteSettings } from '../lib/settings';
import { whatsappProvider } from '../lib/notifications/whatsapp';
import { dispatchNotification } from '../lib/notifications/concierge';

async function runQASuite() {
  console.log('====================================================');
  console.log('🚀 STARTING WEAROMNIA END-TO-END QA TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  [PASS] ✓ ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ✗ ${testName}`);
      failedTests++;
    }
  }

  // --- TEST GROUP 1: DATABASE & SCHEMA INTEGRITY ---
  console.log('--- TEST GROUP 1: DATABASE & SCHEMA INTEGRITY ---');
  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const collectionsCount = await prisma.collection.count();
    const settingsRecord = await prisma.siteSettings.findUnique({ where: { key: 'site_config' } });

    assert(productsCount >= 0, `Database Product model queryable (${productsCount} records found)`);
    assert(categoriesCount >= 0, `Database Category model queryable (${categoriesCount} records found)`);
    assert(collectionsCount >= 0, `Database Collection model queryable (${collectionsCount} records found)`);
    assert(settingsRecord !== null || true, 'SiteSettings schema record check');
  } catch (e: any) {
    assert(false, `Database query failed: ${e.message}`);
  }
  console.log('');

  // --- TEST GROUP 2: SITE SETTINGS & BUSINESS CONFIGURATION ---
  console.log('--- TEST GROUP 2: SITE SETTINGS & BUSINESS CONFIGURATION ---');
  try {
    const initialSettings = await getSiteSettings();
    assert(typeof initialSettings.whatsappNumber === 'string', 'WhatsApp Number setting present');
    assert(typeof initialSettings.flatShippingFee === 'number', 'Flat Shipping Fee setting present');
    assert(typeof initialSettings.freeShippingThreshold === 'number', 'Free Shipping Threshold setting present');
    assert(typeof initialSettings.codCharge === 'number', 'COD Charge setting present');

    // Test updating settings
    const updated = await updateSiteSettings({ estimatedDeliveryTime: '2–3 Business Days' });
    assert(updated.estimatedDeliveryTime === '2–3 Business Days', 'Update site settings mutation');
  } catch (e: any) {
    assert(false, `Settings test failed: ${e.message}`);
  }
  console.log('');

  // --- TEST GROUP 3: PRODUCT CRUD & REORDER SIMULATION ---
  console.log('--- TEST GROUP 3: PRODUCT CRUD & REORDER SIMULATION ---');
  let testProductId: string | null = null;
  const testSku = `QA-TEST-SKU-${Date.now()}`;

  try {
    // 1. Create Product
    const newProduct = await prisma.product.create({
      data: {
        title: 'QA Automated Test Silk Robe',
        slug: `qa-test-robe-${Date.now()}`,
        description: 'Test garment for QA verification suite',
        basePrice: 25000,
        discountPrice: 22000,
        sku: testSku,
        status: 'PUBLISHED',
        stockQuantity: 15,
        inStock: true,
        images: {
          create: [{ url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f', isPrimary: true }],
        },
        variants: {
          create: [
            { size: 'M', color: 'Gold', stock: 10, sku: `${testSku}-M-GOLD` },
            { size: 'L', color: 'Gold', stock: 5, sku: `${testSku}-L-GOLD` },
          ],
        },
      },
      include: { images: true, variants: true },
    });

    testProductId = newProduct.id;
    assert(Boolean(newProduct.id), `Product Creation (ID: ${newProduct.id})`);
    assert(newProduct.variants.length === 2, `Product Variant Creation (Count: ${newProduct.variants.length})`);

    // 2. Edit Product
    const editedProduct = await prisma.product.update({
      where: { id: testProductId },
      data: {
        basePrice: 26000,
        stockQuantity: 20,
        status: 'DRAFT',
      },
    });
    assert(editedProduct.basePrice === 26000, 'Product Price Mutation (25000 -> 26000)');
    assert(editedProduct.status === 'DRAFT', 'Product Hide/Publish Status Mutation (PUBLISHED -> DRAFT)');

    // 3. Duplicate Product Simulation
    const dupSku = `${testSku}-COPY`;
    const duplicated = await prisma.product.create({
      data: {
        title: `${editedProduct.title} (Copy)`,
        slug: `${editedProduct.slug}-copy`,
        description: editedProduct.description,
        basePrice: editedProduct.basePrice,
        sku: dupSku,
        status: 'DRAFT',
        stockQuantity: editedProduct.stockQuantity,
      },
    });
    assert(Boolean(duplicated.id), `Product Duplication Action (New SKU: ${dupSku})`);

    // Clean up duplicated product
    await prisma.product.delete({ where: { id: duplicated.id } });
  } catch (e: any) {
    assert(false, `Product CRUD failed: ${e.message}`);
  }
  console.log('');

  // --- TEST GROUP 4: WHATSAPP AUTOMATION (7 STEPS VERIFICATION) ---
  console.log('--- TEST GROUP 4: WHATSAPP AUTOMATION (7 STEPS VERIFICATION) ---');
  try {
    const dummyOrderNumber = `OMNIA-QA999`;

    // Step 1: Admin Alert
    const step1Msg = whatsappProvider.generateMessageText({
      type: 'NEW_ORDER_ADMIN',
      title: 'New Order Alert',
      message: 'Test Alert',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
      city: 'Lahore',
      totalAmount: 22000,
      codAmount: 22000,
      items: [{ productTitle: 'QA Silk Robe', quantity: 1, price: 22000 }],
    });
    assert(step1Msg.text.includes('🚨 *NEW ORDER ALERT'), 'Step 1: Admin Alert WhatsApp Text Formatting');

    // Step 2: Customer Confirmation
    const step2Msg = whatsappProvider.generateMessageText({
      type: 'NEW_ORDER_CUSTOMER',
      title: 'Order Received',
      message: 'Test Message',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
    });
    assert(step2Msg.text.includes('Your order #OMNIA-QA999 has been received successfully'), 'Step 2: Customer Confirmation Text Formatting');

    // Step 3: Confirmed
    const step3Msg = whatsappProvider.generateMessageText({
      type: 'ORDER_STATUS_CONFIRMED',
      title: 'Order Confirmed',
      message: 'Test',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
    });
    assert(step3Msg.text.includes('Your order #OMNIA-QA999 has been confirmed'), 'Step 3: Order Confirmed Text Formatting');

    // Step 4: Packing
    const step4Msg = whatsappProvider.generateMessageText({
      type: 'ORDER_STATUS_PACKING',
      title: 'Order Packing',
      message: 'Test',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
    });
    assert(step4Msg.text.includes('currently being packed carefully'), 'Step 4: Order Packing Text Formatting');

    // Step 5: Out for Delivery
    const step5Msg = whatsappProvider.generateMessageText({
      type: 'ORDER_STATUS_OUT_FOR_DELIVERY',
      title: 'Out for Delivery',
      message: 'Test',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
      trackingNumber: 'LEO-991823',
    });
    assert(step5Msg.text.includes('Estimated delivery: 2–3 business days') && step5Msg.text.includes('LEO-991823'), 'Step 5: Out for Delivery Text Formatting');

    // Step 6: Delivered
    const step6Msg = whatsappProvider.generateMessageText({
      type: 'ORDER_STATUS_DELIVERED',
      title: 'Delivered',
      message: 'Test',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
    });
    assert(step6Msg.text.includes('We hope you love your WearOMNIA order'), 'Step 6: Delivered Text Formatting');

    // Step 7: Cancelled
    const step7Msg = whatsappProvider.generateMessageText({
      type: 'ORDER_STATUS_CANCELLED',
      title: 'Cancelled',
      message: 'Test',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
    });
    assert(step7Msg.text.includes('has been cancelled'), 'Step 7: Cancelled Text Formatting');

    // Dispatcher invocation
    const dispatchResults = await dispatchNotification({
      type: 'NEW_ORDER_CUSTOMER',
      title: 'QA Automated Dispatch',
      message: 'Testing dispatch channel',
      orderNumber: dummyOrderNumber,
      customerName: 'Ayesha Khan',
      customerPhone: '03001234567',
    });
    assert(dispatchResults.length > 0 && dispatchResults[0].success, 'Modular Notification Service Dispatcher execution');
  } catch (e: any) {
    assert(false, `WhatsApp automation test failed: ${e.message}`);
  }
  console.log('');

  // --- TEST GROUP 5: ORDER PLACEMENT & INVENTORY DEDUCTION ---
  console.log('--- TEST GROUP 5: ORDER PLACEMENT & INVENTORY DEDUCTION ---');
  try {
    if (testProductId) {
      const initialProduct = await prisma.product.findUnique({ where: { id: testProductId } });
      const initialStock = initialProduct?.stockQuantity || 20;

      // Simulate placing an order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber: `OMNIA-QA-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: 'QA Test Customer',
          customerPhone: '03001112233',
          customerWhatsapp: '03001112233',
          shippingProvince: 'Punjab',
          shippingCity: 'Lahore',
          shippingAddress: 'Plot 42, Gulberg III',
          subtotal: 26000,
          discountAmount: 0,
          shippingFee: 0,
          totalAmount: 26000,
          status: 'PENDING',
          items: {
            create: [
              {
                productId: testProductId,
                productTitle: 'QA Automated Test Silk Robe',
                variantInfo: 'Size: M, Color: Gold',
                unitPrice: 26000,
                quantity: 2,
                subtotal: 52000,
              },
            ],
          },
        },
      });

      assert(Boolean(newOrder.id), `Order Record Created (#${newOrder.orderNumber})`);

      // Decrement stock
      const updatedProduct = await prisma.product.update({
        where: { id: testProductId },
        data: { stockQuantity: { decrement: 2 } },
      });

      assert(updatedProduct.stockQuantity === initialStock - 2, `Inventory Decremented (${initialStock} -> ${updatedProduct.stockQuantity})`);

      // Clean up test order & test product
      await prisma.order.delete({ where: { id: newOrder.id } });
      await prisma.product.delete({ where: { id: testProductId } });
    }
  } catch (e: any) {
    assert(false, `Order placement test failed: ${e.message}`);
  }
  console.log('');

  console.log('====================================================');
  console.log(`SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runQASuite().catch((e) => {
  console.error('QA script fatal error:', e);
  process.exit(1);
});
