-- ==========================================
-- WEAROMNIA SUPABASE SECURITY FIXES
-- ==========================================
-- This script enables RLS and creates security policies
-- for the WearOMNIA e-commerce application
-- 
-- Architecture: Prisma-based server-side access
-- No direct Supabase client access from frontend
-- ==========================================

-- ==========================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public."SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InventoryLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ContactSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShippingRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderTimeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NotificationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SizeGuide" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SizeGuideEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Shipment" ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROTECT ADMIN PASSWORD COLUMN
-- ==========================================

-- Create a view that excludes the password column for public access
CREATE OR REPLACE VIEW public."AdminSafe" AS
SELECT 
    id,
    email,
    name,
    "createdAt",
    "updatedAt"
FROM public."Admin";

-- Grant access to the safe view
GRANT SELECT ON public."AdminSafe" TO anon;
GRANT SELECT ON public."AdminSafe" TO authenticated;

-- Revoke direct access to Admin table from public roles
REVOKE ALL ON public."Admin" FROM anon;
REVOKE ALL ON public."Admin" FROM authenticated;

-- Grant service role access for Prisma
-- (Service role bypasses RLS automatically)

-- ==========================================
-- PUBLIC/STOREFRONT DATA POLICIES
-- ==========================================

-- Product: Public read access for published products
CREATE POLICY "Allow public read access to published products"
ON public."Product" FOR SELECT
TO anon, authenticated
USING (status = 'PUBLISHED');

-- ProductImage: Public read access
CREATE POLICY "Allow public read access to product images"
ON public."ProductImage" FOR SELECT
TO anon, authenticated
USING (true);

-- ProductVariant: Public read access
CREATE POLICY "Allow public read access to product variants"
ON public."ProductVariant" FOR SELECT
TO anon, authenticated
USING (true);

-- Category: Public read access
CREATE POLICY "Allow public read access to categories"
ON public."Category" FOR SELECT
TO anon, authenticated
USING (true);

-- Collection: Public read access
CREATE POLICY "Allow public read access to collections"
ON public."Collection" FOR SELECT
TO anon, authenticated
USING (true);

-- SizeGuide: Public read access
CREATE POLICY "Allow public read access to size guides"
ON public."SizeGuide" FOR SELECT
TO anon, authenticated
USING (true);

-- SizeGuideEntry: Public read access
CREATE POLICY "Allow public read access to size guide entries"
ON public."SizeGuideEntry" FOR SELECT
TO anon, authenticated
USING (true);

-- SiteSettings: Public read access (non-sensitive settings only)
CREATE POLICY "Allow public read access to safe site settings"
ON public."SiteSettings" FOR SELECT
TO anon, authenticated
USING (
    key NOT IN (
        'whatsapp_access_token',
        'whatsapp_phone_number_id',
        'whatsapp_app_secret',
        'postex_api_key',
        'postex_api_token',
        'postex_merchant_id',
        'postex_account_id',
        'database_credentials',
        'api_keys'
    )
);

-- Review: Public read access to approved reviews only
CREATE POLICY "Allow public read access to approved reviews"
ON public."Review" FOR SELECT
TO anon, authenticated
USING ("isApproved" = true);

-- Review: Allow insert for public (review submission)
CREATE POLICY "Allow public insert for reviews"
ON public."Review" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ==========================================
-- PRIVATE CUSTOMER/ORDER DATA POLICIES
-- ==========================================

-- Customer: No public access (server-side only)
CREATE POLICY "Block public access to customers"
ON public."Customer" FOR ALL
TO anon, authenticated
USING (false);

-- Order: No public access (server-side only)
CREATE POLICY "Block public access to orders"
ON public."Order" FOR ALL
TO anon, authenticated
USING (false);

-- OrderItem: No public access (server-side only)
CREATE POLICY "Block public access to order items"
ON public."OrderItem" FOR ALL
TO anon, authenticated
USING (false);

-- OrderTimeline: No public access (server-side only)
CREATE POLICY "Block public access to order timeline"
ON public."OrderTimeline" FOR ALL
TO anon, authenticated
USING (false);

-- Shipment: No public access (server-side only)
CREATE POLICY "Block public access to shipments"
ON public."Shipment" FOR ALL
TO anon, authenticated
USING (false);

-- ContactSubmission: No public access (server-side only)
CREATE POLICY "Block public access to contact submissions"
ON public."ContactSubmission" FOR ALL
TO anon, authenticated
USING (false);

-- NewsletterSubscriber: No public access (server-side only)
CREATE POLICY "Block public access to newsletter subscribers"
ON public."NewsletterSubscriber" FOR ALL
TO anon, authenticated
USING (false);

-- ==========================================
-- ADMIN-ONLY TABLES POLICIES
-- ==========================================

-- Admin: No public access (use AdminSafe view)
CREATE POLICY "Block public access to admin table"
ON public."Admin" FOR ALL
TO anon, authenticated
USING (false);

-- AdminNotification: No public access (server-side only)
CREATE POLICY "Block public access to admin notifications"
ON public."AdminNotification" FOR ALL
TO anon, authenticated
USING (false);

-- AuditLog: No public access (server-side only)
CREATE POLICY "Block public access to audit logs"
ON public."AuditLog" FOR ALL
TO anon, authenticated
USING (false);

-- InventoryLog: No public access (server-side only)
CREATE POLICY "Block public access to inventory logs"
ON public."InventoryLog" FOR ALL
TO anon, authenticated
USING (false);

-- NotificationLog: No public access (server-side only)
CREATE POLICY "Block public access to notification logs"
ON public."NotificationLog" FOR ALL
TO anon, authenticated
USING (false);

-- ShippingRule: No public access (server-side only)
CREATE POLICY "Block public access to shipping rules"
ON public."ShippingRule" FOR ALL
TO anon, authenticated
USING (false);

-- Coupon: No public access (server-side validation only)
CREATE POLICY "Block public access to coupons"
ON public."Coupon" FOR ALL
TO anon, authenticated
USING (false);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify Admin table has no public access
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'Admin';

-- Verify AdminSafe view exists
SELECT 
    viewname,
    definition
FROM pg_views
WHERE viewname = 'AdminSafe';

-- Verify sensitive settings are protected
SELECT 
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE tablename = 'SiteSettings';

-- ==========================================
-- NOTES
-- ==========================================
-- 
-- 1. Service Role: The application uses Prisma with the database
--    connection string. The service role (database owner) bypasses
--    RLS automatically, so server-side Prisma operations work
--    normally.
--
-- 2. Public Access: Public roles (anon, authenticated) now have
--    restricted access. They can only read public storefront data
--    (products, categories, reviews) and cannot access private
--    customer/order/admin data.
--
-- 3. Admin Password: The Admin.password column is protected by:
--    - RLS policy blocking all public access
--    - AdminSafe view excluding the password column
--    - Revoked direct grants to public roles
--
-- 4. Prisma Compatibility: Since Prisma uses the database owner
--    connection (service role), it bypasses RLS and continues to
--    work normally. The policies only affect direct Supabase
--    client access, which the application doesn't use.
--
-- 5. Application Testing: After running this script, test:
--    - Public storefront (products, categories, reviews)
--    - Checkout flow
--    - Admin login
--    - Admin dashboard
--    - Order management
--
-- ==========================================