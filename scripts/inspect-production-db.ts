import { prisma } from '../lib/prisma';

async function inspectProductionDb() {
  console.log('--- Inspecting Production Database Records ---');
  
  // 1. site_config
  const siteConfigRecord = await prisma.siteSettings.findUnique({
    where: { key: 'site_config' },
  });
  console.log('site_config exists:', !!siteConfigRecord);
  if (siteConfigRecord) {
    const val = JSON.parse(siteConfigRecord.value);
    console.log('site_config announcementEnabled:', val.announcementEnabled);
    console.log('site_config announcementText:', val.announcementText);
    console.log('site_config freeShippingThreshold:', val.freeShippingThreshold);
  }

  // 2. preorder_config
  const preorderConfigRecord = await prisma.siteSettings.findUnique({
    where: { key: 'preorder_config' },
  });
  console.log('preorder_config exists:', !!preorderConfigRecord);
  if (preorderConfigRecord) {
    const val = JSON.parse(preorderConfigRecord.value);
    console.log('preorder_config preorder_enabled:', val.preorder_enabled);
    console.log('preorder_config preorder_advance_percent:', val.preorder_advance_percent);
    console.log('preorder_config preorder_advance_enabled:', val.preorder_advance_enabled);
  }

  // 3. coupon PREORDER500
  const coupon = await prisma.coupon.findUnique({
    where: { code: 'PREORDER500' },
  });
  console.log('PREORDER500 coupon exists:', !!coupon);
  if (coupon) {
    console.log('PREORDER500 isActive:', coupon.isActive);
    console.log('PREORDER500 startDate:', coupon.startDate);
    console.log('PREORDER500 expiryDate:', coupon.expiryDate);
    const now = new Date();
    const startMs = coupon.startDate ? new Date(coupon.startDate).getTime() : 0;
    const endMs = coupon.expiryDate ? new Date(coupon.expiryDate).getTime() : 0;
    console.log('Current time (server):', now.toISOString());
    console.log('Is before start?', now.getTime() < startMs);
    console.log('Is after expiry?', now.getTime() > endMs);
  }

  // 4. payment methods
  const paymentMethods = await prisma.preOrderPaymentMethod.findMany();
  console.log('Total payment methods:', paymentMethods.length);
  console.log('Active payment methods count:', paymentMethods.filter(p => p.isActive).length);
}

inspectProductionDb().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
