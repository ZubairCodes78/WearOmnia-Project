import { prisma } from '../lib/prisma';

async function main() {
  console.log('Running SQL migration for review WhatsApp dispatch tracking...');
  
  const statements = [
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewWhatsAppSentAt" TIMESTAMP;`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewWhatsAppMessageId" TEXT;`,
    `CREATE INDEX IF NOT EXISTS "Order_reviewWhatsAppSentAt_idx" ON "Order"("reviewWhatsAppSentAt");`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`Executed: ${sql}`);
    } catch (err: any) {
      console.error(`Error executing: ${sql}`, err?.message);
    }
  }

  console.log('Migration finished.');
}

main().catch(console.error);
