-- Customer Review System Migration for WearOMNIA
-- Safe to run on production: IF NOT EXISTS / no DROP / no data loss

-- 1. Extend Order table with cryptographic review token and expiry
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewToken" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_reviewToken_key" ON "Order"("reviewToken");
CREATE INDEX IF NOT EXISTS "Order_reviewToken_idx" ON "Order"("reviewToken");

-- 2. Extend Review table with order linkage, verified purchase flag, admin status, and customer phone
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "verifiedPurchase" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Foreign key to Order
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Review_orderId_fkey'
    ) THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes for performance and duplicate prevention
CREATE INDEX IF NOT EXISTS "Review_orderId_idx" ON "Review"("orderId");
CREATE INDEX IF NOT EXISTS "Review_status_idx" ON "Review"("status");
CREATE INDEX IF NOT EXISTS "Review_orderId_productId_idx" ON "Review"("orderId", "productId");

