-- WearOMNIA Seasonal Sale & Campaign Management System Migration
-- Safe to run on production: uses IF NOT EXISTS / no DROP / no data loss

-- 1. Extend Order table with historical campaign discount snapshots
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignSlug" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campaignDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Order_campaignId_idx" ON "Order"("campaignId");

-- 2. Extend OrderItem table with per-item campaign discount snapshots
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "campaignName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "campaignDiscountPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "OrderItem_campaignId_idx" ON "OrderItem"("campaignId");

-- 3. Create Campaign table
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name"                   TEXT NOT NULL,
    "slug"                   TEXT NOT NULL,
    "internalDescription"    TEXT,
    "publicTitle"            TEXT NOT NULL,
    "badgeText"              TEXT DEFAULT 'SALE',
    "status"                 TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate"              TIMESTAMP(3),
    "endDate"                TIMESTAMP(3),
    "timezone"               TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "priority"               INTEGER NOT NULL DEFAULT 10,
    "scopeType"              TEXT NOT NULL DEFAULT 'SELECTED_PRODUCTS',
    "includedProductIds"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "excludedProductIds"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "includedCollectionIds"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "includedCategoryIds"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "allowPreOrderProducts"  BOOLEAN NOT NULL DEFAULT FALSE,
    "couponStackingMode"     TEXT NOT NULL DEFAULT 'BLOCK_COUPONS',
    "discountType"           TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDiscountAmount"      DOUBLE PRECISION,
    "bannerTitle"            TEXT,
    "bannerSubtitle"         TEXT,
    "desktopBannerUrl"       TEXT,
    "mobileBannerUrl"        TEXT,
    "showBanner"             BOOLEAN NOT NULL DEFAULT TRUE,
    "replaceHeroSlider"      BOOLEAN NOT NULL DEFAULT FALSE,
    "announcementEnabled"    BOOLEAN NOT NULL DEFAULT FALSE,
    "announcementText"       TEXT,
    "ctaText"                TEXT DEFAULT 'Shop Sale',
    "ctaLink"                TEXT,
    "showCountdown"          BOOLEAN NOT NULL DEFAULT TRUE,
    "landingPageEnabled"     BOOLEAN NOT NULL DEFAULT TRUE,
    "landingPageDescription" TEXT,
    "seoTitle"               TEXT,
    "seoDescription"         TEXT,
    "previewToken"           TEXT,
    "createdBy"              TEXT,
    "updatedBy"              TEXT,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_slug_key" ON "Campaign"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Campaign_previewToken_key" ON "Campaign"("previewToken");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "Campaign_startDate_endDate_idx" ON "Campaign"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "Campaign_priority_idx" ON "Campaign"("priority");
CREATE INDEX IF NOT EXISTS "Campaign_slug_idx" ON "Campaign"("slug");

