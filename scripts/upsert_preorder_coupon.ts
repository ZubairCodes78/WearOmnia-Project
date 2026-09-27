import { PrismaClient } from '@prisma/client';
import { WEAROMNIA_CAMPAIGN } from '../lib/preorder';

const prisma = new PrismaClient();

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: WEAROMNIA_CAMPAIGN.code },
    update: {
      discountType: 'FIXED',
      discountValue: WEAROMNIA_CAMPAIGN.discountAmount,
      minOrderAmount: 0,
      isActive: true,
      expiryDate: new Date(WEAROMNIA_CAMPAIGN.endIso),
    },
    create: {
      code: WEAROMNIA_CAMPAIGN.code,
      discountType: 'FIXED',
      discountValue: WEAROMNIA_CAMPAIGN.discountAmount,
      minOrderAmount: 0,
      isActive: true,
      expiryDate: new Date(WEAROMNIA_CAMPAIGN.endIso),
    },
  });

  console.log('Successfully upserted campaign coupon:', coupon);
}

main()
  .catch((err) => {
    console.error('Error upserting coupon:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
