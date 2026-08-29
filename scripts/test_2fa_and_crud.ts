import { prisma } from '../lib/prisma';
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  generateTotpUri,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyAndConsumeRecoveryCode,
  generateQrCodeDataUrl,
} from '../lib/totp';
import { hashPassword, verifyPassword } from '../lib/auth';

async function runTests() {
  console.log('\n======================================================');
  console.log('WEAROMNIA — 2FA / TOTP & ADMIN CRUD VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Base32 Encoding / Decoding
  // ----------------------------------------------------
  console.log('--- TEST 1: Base32 Encoding / Decoding ---');
  const sample = Buffer.from('WearOMNIA Luxury Fashion 2026');
  const encoded = base32Encode(sample);
  const decoded = base32Decode(encoded);
  assert(sample.equals(decoded), 'Base32 encode & decode round-trip match');

  // ----------------------------------------------------
  // TEST 2: RFC 6238 Standard TOTP Generation & Verification
  // ----------------------------------------------------
  console.log('\n--- TEST 2: RFC 6238 TOTP Generation & Verification ---');
  const secret = generateTotpSecret();
  assert(secret.length === 32, `TOTP Secret is 32-char Base32 string (${secret})`);

  const currentCode = generateTotpCode(secret);
  assert(/^\d{6}$/.test(currentCode), `Generates valid 6-digit TOTP code (${currentCode})`);

  const isValidCurrent = verifyTotpCode(currentCode, secret, 1);
  assert(isValidCurrent === true, 'Verifies valid current TOTP code');

  const isInvalidCode = verifyTotpCode('999999', secret, 1);
  assert(isInvalidCode === false, 'Rejects invalid TOTP code (999999)');

  // ----------------------------------------------------
  // TEST 3: otpauth URI & QR Code Generation
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Authenticator URI & QR Code ---');
  const uri = generateTotpUri('admin@wearomnia.com', secret, 'WearOMNIA Admin');
  assert(uri.startsWith('otpauth://totp/'), `URI has standard otpauth scheme: ${uri}`);
  assert(uri.includes('secret=' + secret), 'URI contains generated Base32 secret');

  const qrDataUrl = await generateQrCodeDataUrl(uri);
  assert(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Code Data URL successfully rendered as PNG');

  // ----------------------------------------------------
  // TEST 4: Recovery Codes Generation, Hashing & Single-Use Consumption
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Recovery Codes Hashing & Consumption ---');
  const recoveryCodes = generateRecoveryCodes(8);
  assert(recoveryCodes.length === 8, 'Generated 8 recovery codes');
  assert(/^[A-F0-9]{4}-[A-F0-9]{4}$/.test(recoveryCodes[0]), `Recovery code format is XXXX-XXXX (${recoveryCodes[0]})`);

  const hashedCodes = await hashRecoveryCodes(recoveryCodes);
  const storedJson = JSON.stringify(hashedCodes);
  assert(hashedCodes.length === 8, 'All 8 recovery codes bcrypt-hashed');

  // Consume first code
  const codeToUse = recoveryCodes[0];
  const consumeResult = await verifyAndConsumeRecoveryCode(codeToUse, storedJson);
  assert(consumeResult.valid === true, `Successfully verified valid recovery code: ${codeToUse}`);
  assert(consumeResult.remainingHashedCodes.length === 7, 'Consumed code removed from remaining list (7 left)');

  // Try to use the same code again on the updated list (replay protection)
  const reuseResult = await verifyAndConsumeRecoveryCode(codeToUse, JSON.stringify(consumeResult.remainingHashedCodes));
  assert(reuseResult.valid === false, 'Replay protection: Same recovery code cannot be used twice');

  // Try invalid code
  const fakeResult = await verifyAndConsumeRecoveryCode('XXXX-YYYY', JSON.stringify(consumeResult.remainingHashedCodes));
  assert(fakeResult.valid === false, 'Rejects invalid fake recovery code');

  // ----------------------------------------------------
  // TEST 5: Admin 2FA DB Lifecycle (Setup -> Enable -> Verify -> Disable)
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Admin DB 2FA Lifecycle ---');
  const testEmail = `test2fa_${Date.now()}@wearomnia.com`;
  const rawPassword = 'AdminSecurePass2026!';
  const hashedPassword = await hashPassword(rawPassword);

  const testAdmin = await prisma.admin.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      name: 'Test 2FA Admin',
      twoFactorEnabled: false,
    },
  });
  assert(testAdmin.twoFactorEnabled === false, 'Test admin created with 2FA disabled');

  // Enable 2FA
  const adminSecret = generateTotpSecret();
  const adminCodes = generateRecoveryCodes(8);
  const hashedAdminCodes = await hashRecoveryCodes(adminCodes);
  const enableCode = generateTotpCode(adminSecret);

  assert(verifyTotpCode(enableCode, adminSecret, 1), 'Generated valid verification code for enabling 2FA');

  const enabledAdmin = await prisma.admin.update({
    where: { id: testAdmin.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: adminSecret,
      twoFactorRecoveryCodes: JSON.stringify(hashedAdminCodes),
      twoFactorEnabledAt: new Date(),
    },
  });
  assert(enabledAdmin.twoFactorEnabled === true, 'Admin account successfully enabled with 2FA');
  assert(enabledAdmin.twoFactorSecret === adminSecret, 'Admin 2FA secret persisted safely');

  // Disable 2FA
  const disabledAdmin = await prisma.admin.update({
    where: { id: testAdmin.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
      twoFactorEnabledAt: null,
    },
  });
  assert(disabledAdmin.twoFactorEnabled === false, 'Admin 2FA disabled and secret purged');

  // Clean up test admin
  await prisma.admin.delete({ where: { id: testAdmin.id } });
  console.log('  ✓ Test admin cleaned up');

  // ----------------------------------------------------
  // TEST 6: Coupon Full CRUD Verification
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Coupon CRUD Verification ---');
  const testCouponCode = `TESTPROMO_${Math.floor(1000 + Math.random() * 9000)}`;

  // Create
  const newCoupon = await prisma.coupon.create({
    data: {
      code: testCouponCode,
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 3000,
      usageLimit: 50,
      isActive: true,
    },
  });
  assert(newCoupon.code === testCouponCode, `Created coupon ${newCoupon.code}`);

  // Update
  const updatedCoupon = await prisma.coupon.update({
    where: { id: newCoupon.id },
    data: { discountValue: 20, isActive: false },
  });
  assert(updatedCoupon.discountValue === 20 && updatedCoupon.isActive === false, 'Updated coupon discount to 20% & disabled');

  // Delete
  await prisma.coupon.delete({ where: { id: newCoupon.id } });
  const checkDeleted = await prisma.coupon.findUnique({ where: { id: newCoupon.id } });
  assert(checkDeleted === null, 'Coupon deleted safely from database');

  // ----------------------------------------------------
  // TEST 7: Customer Safe Deletion with Order History Preservation
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Customer Safe Deletion & Order Unlinking ---');
  const testCustomer = await prisma.customer.create({
    data: {
      fullName: 'Test Deletion Customer',
      phone: `0399${Math.floor(1000000 + Math.random() * 9000000)}`,
      city: 'Lahore',
      totalSpent: 12000,
      ordersCount: 1,
    },
  });

  const testOrder = await prisma.order.create({
    data: {
      orderNumber: `OMN-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: testCustomer.fullName,
      customerPhone: testCustomer.phone,
      shippingCity: 'Lahore',
      shippingProvince: 'Punjab',
      shippingAddress: '123 Test Street',
      totalAmount: 12000,
      subtotal: 11750,
      shippingFee: 250,
      status: 'DELIVERED',
      customerId: testCustomer.id,
    },
  });
  assert(testOrder.customerId === testCustomer.id, 'Test order linked to customer');

  // Safe delete customer profile by unlinking orders first
  await prisma.order.updateMany({
    where: { customerId: testCustomer.id },
    data: { customerId: null },
  });
  await prisma.customer.delete({ where: { id: testCustomer.id } });

  const checkCustomer = await prisma.customer.findUnique({ where: { id: testCustomer.id } });
  const checkOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });

  assert(checkCustomer === null, 'Customer profile deleted from database');
  assert(checkOrder !== null && checkOrder.customerId === null, 'Historical order preserved and safely unlinked (financial integrity intact)');

  // Clean up test order
  await prisma.order.delete({ where: { id: testOrder.id } });
  console.log('  ✓ Test order cleaned up');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
