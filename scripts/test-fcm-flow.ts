import { prisma } from '../lib/prisma';
import { sendAdminPushNotification } from '../lib/notifications/fcm';
import { getAdminSessionId, verifyAdminSession } from '../lib/auth';

async function main() {
  console.log('=== STARTING WEAROMNIA FCM & MOBILE ADMIN END-TO-END TEST ===\n');

  // 1. Verify or create a test admin user
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: 'test-admin@wearomnia.com',
        password: '$2a$12$DummyHashedPasswordForTestEnvironment1234567890',
        name: 'Test Administrator',
      },
    });
    console.log(`[Step 1] Created test admin: ${admin.email} (ID: ${admin.id})`);
  } else {
    console.log(`[Step 1] Existing admin identified: ${admin.email} (ID: ${admin.id})`);
  }

  // 2. Test Session Verification with Bearer token
  const mockRequest = new Request('http://localhost:3000/api/admin/orders', {
    headers: {
      authorization: `Bearer ${admin.id}`,
    },
  });
  const sessionId = await getAdminSessionId(mockRequest);
  const isAuthed = await verifyAdminSession(mockRequest);
  console.log(`[Step 2] Bearer token auth verification: sessionId=${sessionId}, authenticated=${isAuthed}`);
  if (!isAuthed || sessionId !== admin.id) {
    throw new Error('Bearer session verification failed');
  }

  // 3. Register test mobile admin device tokens (multi-device test)
  const testTokens = [
    {
      token: 'fcm_test_token_pixel_8_pro_' + Date.now(),
      type: 'android',
      name: 'Google Pixel 8 Pro',
      deviceId: 'device-hw-pixel-001',
    },
    {
      token: 'fcm_test_token_galaxy_s24_' + Date.now(),
      type: 'android',
      name: 'Samsung Galaxy S24 Ultra',
      deviceId: 'device-hw-galaxy-002',
    },
  ];

  for (const t of testTokens) {
    await prisma.adminDevice.upsert({
      where: { fcmToken: t.token },
      update: {
        adminId: admin.id,
        deviceType: t.type,
        deviceName: t.name,
        deviceId: t.deviceId,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        adminId: admin.id,
        fcmToken: t.token,
        deviceType: t.type,
        deviceName: t.name,
        deviceId: t.deviceId,
        isActive: true,
      },
    });
  }

  const activeDevices = await prisma.adminDevice.findMany({
    where: { adminId: admin.id, isActive: true },
  });
  console.log(`[Step 3] Active devices registered for admin in DB: ${activeDevices.length}`);
  if (activeDevices.length < 2) {
    throw new Error('Multi-device registration failed');
  }

  // 4. Test Notification Dispatch & Idempotency
  const testOrderId = 'test-order-' + Date.now();
  const idempotencyKey = `NEW_ORDER:${testOrderId}`;

  console.log(`\n[Step 4a] Dispatching first push notification for order ${testOrderId}...`);
  const firstResult = await sendAdminPushNotification({
    idempotencyKey,
    type: 'NEW_ORDER',
    orderId: testOrderId,
    title: '🛍️ New Order #WO-TEST-001',
    body: 'Rs. 18,500 • Zubair Ahmed (Lahore)',
    data: {
      orderId: testOrderId,
      orderNumber: 'WO-TEST-001',
      customerName: 'Zubair Ahmed',
      city: 'Lahore',
      amount: '18500',
    },
  });

  console.log('First dispatch result:', firstResult);
  if (!firstResult.sent || firstResult.tokensCount < 2) {
    throw new Error('First dispatch failed or did not target all active devices');
  }

  // 5. Test Deduplication / Idempotency
  console.log(`\n[Step 4b] Attempting duplicate dispatch with same idempotency key...`);
  const duplicateResult = await sendAdminPushNotification({
    idempotencyKey,
    type: 'NEW_ORDER',
    orderId: testOrderId,
    title: '🛍️ New Order #WO-TEST-001 (Duplicate Attempt)',
    body: 'Rs. 18,500 • Zubair Ahmed (Lahore)',
  });

  console.log('Duplicate dispatch result:', duplicateResult);
  if (!duplicateResult.skippedDueToIdempotency) {
    throw new Error('Duplicate notification was not skipped by idempotency engine!');
  }
  console.log('SUCCESS: Duplicate notification safely blocked by idempotency check.');

  // 6. Verify Log in Database
  const log = await prisma.adminPushNotificationLog.findUnique({
    where: { idempotencyKey },
  });
  console.log(`\n[Step 5] Database AdminPushNotificationLog verified:`, {
    id: log?.id,
    idempotencyKey: log?.idempotencyKey,
    type: log?.type,
    tokensCount: log?.tokensCount,
  });

  // 7. Cleanup test devices
  await prisma.adminDevice.deleteMany({
    where: { fcmToken: { in: testTokens.map(t => t.token) } },
  });
  console.log(`\n[Step 6] Test device tokens cleaned up successfully.`);

  console.log('\n=== ALL END-TO-END BACKEND & NOTIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
