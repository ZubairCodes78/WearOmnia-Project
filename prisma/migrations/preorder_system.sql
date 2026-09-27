-- WearOMNIA Pre-order System Migration
-- Safe to run on production: uses IF NOT EXISTS / no DROP / no data loss
-- Run this in your Supabase SQL editor or via psql

-- 1. Add pre-order fields to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPreOrder" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "preOrderAdvancePercent" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "preOrderNote" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "preOrderEstimatedAvailability" TEXT;

-- 2. Create index on isPreOrder
CREATE INDEX IF NOT EXISTS "Product_isPreOrder_idx" ON "Product"("isPreOrder");

-- 3. Add pre-order payment fields to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isPreOrder" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentMethodName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentScreenshotUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderAdvancePercent" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderAdvanceAmount" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderRemainingAmount" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentVerifiedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentRejectionReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentRejectedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preOrderPaymentRejectedBy" TEXT;

-- 4. Create indexes for pre-order filtering
CREATE INDEX IF NOT EXISTS "Order_isPreOrder_idx" ON "Order"("isPreOrder");
CREATE INDEX IF NOT EXISTS "Order_preOrderPaymentStatus_idx" ON "Order"("preOrderPaymentStatus");

-- 5. Create PreOrderPaymentMethod table
CREATE TABLE IF NOT EXISTS "PreOrderPaymentMethod" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "displayName"     TEXT NOT NULL,
    "methodType"      TEXT NOT NULL,
    "accountTitle"    TEXT,
    "accountNumber"   TEXT,
    "walletNumber"    TEXT,
    "bankName"        TEXT,
    "iban"            TEXT,
    "qrCodeImagePath" TEXT,
    "instructions"    TEXT,
    "isActive"        BOOLEAN NOT NULL DEFAULT FALSE,
    "displayOrder"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreOrderPaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PreOrderPaymentMethod_isActive_idx" ON "PreOrderPaymentMethod"("isActive");
CREATE INDEX IF NOT EXISTS "PreOrderPaymentMethod_displayOrder_idx" ON "PreOrderPaymentMethod"("displayOrder");
