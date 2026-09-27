import { PrismaClient } from '@prisma/client';
import { WEAROMNIA_CAMPAIGN } from '../lib/preorder';

const prisma = new PrismaClient();

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: 'PREORDER500' },
    update: {
      discountType: 'FIXED',
      discountValue: 500,
      minOrderAmount: 0,
      isActive: true,
      startDate: new Date('2026-09-29T00:00:00+05:00'),
      expiryDate: new Date('2026-10-20T23:59:59+05:00'),
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
      startDate: new Date('2026-09-29T00:00:00+05:00'),
      expiryDate: new Date('2026-10-20T23:59:59+05:00'),
      timezone: 'Asia/Karachi',
      isPreOrderOnly: true,
      autoApply: false,
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
