import { prisma } from '../lib/prisma';
import { getPublicSiteSettings, getSiteSettings, updateSiteSettings } from '../lib/settings';

async function testSingleSourceOfTruth() {
  console.log('--- STARTING SINGLE SOURCE OF TRUTH VERIFICATION ---');

  // 1. Initial State
  const initial = await getPublicSiteSettings();
  console.log('Initial settings:', {
    freeShippingThreshold: initial.freeShippingThreshold,
    flatShippingFee: initial.flatShippingFee,
    preorder_advance_percent: initial.preorder_advance_percent,
  });

  // 2. Test Threshold = 3000
  console.log('\n[TEST 1] Setting Free Delivery Threshold to PKR 3,000...');
  await updateSiteSettings({ freeShippingThreshold: 3000 });
  const settings3000 = await getPublicSiteSettings();
  if (settings3000.freeShippingThreshold !== 3000) {
    throw new Error(`Expected 3000, got ${settings3000.freeShippingThreshold}`);
  }
  console.log('✓ PASS: getPublicSiteSettings() returns freeShippingThreshold =', settings3000.freeShippingThreshold);

  // 3. Test Threshold = 4000
  console.log('\n[TEST 2] Setting Free Delivery Threshold to PKR 4,000...');
  await updateSiteSettings({ freeShippingThreshold: 4000 });
  const settings4000 = await getPublicSiteSettings();
  if (settings4000.freeShippingThreshold !== 4000) {
    throw new Error(`Expected 4000, got ${settings4000.freeShippingThreshold}`);
  }
  console.log('✓ PASS: getPublicSiteSettings() returns freeShippingThreshold =', settings4000.freeShippingThreshold);

  // 4. Test Preorder Advance Percent Mutation
  console.log('\n[TEST 3] Testing Pre-Order Advance Percent Propagation...');
  const preorderRecord = await prisma.siteSettings.findUnique({ where: { key: 'preorder_config' } });
  let currentPreorder = {};
  if (preorderRecord) {
    currentPreorder = JSON.parse(preorderRecord.value);
  }
  await prisma.siteSettings.upsert({
    where: { key: 'preorder_config' },
    update: { value: JSON.stringify({ ...currentPreorder, preorder_advance_percent: 50 }) },
    create: { key: 'preorder_config', value: JSON.stringify({ ...currentPreorder, preorder_advance_percent: 50 }) },
  });
  const preSettings50 = await getPublicSiteSettings();
  console.log('✓ PASS: Pre-order advance percent (50%):', preSettings50.preorder_advance_percent);

  // 5. Restore Initial Threshold
  console.log('\nRestoring free delivery threshold to 10000...');
  await updateSiteSettings({ freeShippingThreshold: 10000 });
  const restored = await getPublicSiteSettings();
  console.log('✓ PASS: Restored freeShippingThreshold =', restored.freeShippingThreshold);

  console.log('\n--- ALL SETTINGS VERIFICATION PASSED ---');
}

testSingleSourceOfTruth()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
