# WEAROMNIA — DESIGN BASELINE AUDIT (PHASE 0)
**Document Generated:** 2026-09-06  
**Status:** Pristine Baseline Verified (`tsc --noEmit` = 0, `next build` = 0, 63/63 Routes Active)  
**Objective:** Complete visual transformation into a $50,000 luxury commerce platform with **ZERO** business-logic or database regressions.

---

## 1. Baseline Technical Health Verification

| Check | Command | Result | Notes |
|---|---|---|---|
| **TypeScript Compilation** | `npx tsc --noEmit` | **PASS (Exit code 0)** | 0 type errors, strictly typed contracts |
| **Next.js Production Build** | `npm run build` (`prisma generate && next build`) | **PASS (Exit code 0)** | 63 static & dynamic routes generated |
| **Prisma Client Generation** | `prisma generate` | **PASS (v6.19.3)** | PostgreSQL schema synchronized |
| **Route Count** | Next.js Page & Route Inventory | **63 Routes** | 100% route retention required |

---

## 2. Complete Route Inventory (63 Routes Baseline)

### A. Storefront Public Routes (18 Routes)
1. `/` — Home (Hero slider, launch products, brand manifesto, icons, newsletter)
2. `/shop` — Shop Catalog (Filter drawer, sorting, product grid, pagination/infinite scroll)
3. `/product/[slug]` — Product Detail Page (Gallery, lightbox, variant selector, stock display, size guide modal, reviews)
4. `/cart` — Standalone Cart Page (Quantity modifiers, coupon validation, free shipping meter)
5. `/checkout` — Checkout Experience (COD, Pakistani phone/address validation, live shipping calculation, order creation)
6. `/order-success/[orderNumber]` — Order Confirmation (Confetti animation, order summary, tracking link, WhatsApp direct action)
7. `/track-order` — Public Order Tracking (Order # + Phone lookup, live courier status, status timeline)
8. `/contact` — Contact & Support Page (Site settings contact info, helpline, direct WhatsApp)
9. `/faq` — Customer Frequently Asked Questions (Accordion categories: shipping, exchange, sizing, payments)
10. `/size-guide` — Interactive Size & Measurement Charts (Inches/CM toggles, fit guidelines)
11. `/policies/privacy` — Privacy Policy
12. `/policies/refund` — Refund Policy
13. `/policies/returns` — Returns & 7-Day Exchange Policy
14. `/policies/shipping` — Shipping, Delivery Timeframes & COD Policy
15. `/policies/terms` — Terms of Service
16. `/_not-found` — Editorial 404 Experience
17. `/robots.txt` — Search Engine Crawling Rules
18. `/sitemap.xml` — SEO Dynamic XML Sitemap

### B. Admin Operations Routes (23 Routes)
1. `/admin/login` — Administrative Authentication & Rate Limiting
2. `/admin/dashboard` — Executive Operations Command Center (Revenue, AOV, Pipeline, COD CPR, Stock Valuation)
3. `/admin/orders` — Orders Management Console (Status tabs, search, filters, batch operations, pagination)
4. `/admin/orders/[id]` — Order Detail & Dispatch Center (Customer profile, line items, PostEx dispatch, WhatsApp trigger, status change)
5. `/admin/orders/[id]/invoice` — Thermal / A4 Printable Invoice View (No sidebar, barcode, print controls)
6. `/admin/orders/[id]/label` — Courier Shipping Label Generator
7. `/admin/orders/[id]/packing-slip` — Warehouse Order Packing Slip
8. `/admin/products` — Product Catalog Management (CRUD, variant matrix, image upload, status toggle)
9. `/admin/inventory` — Stock Control & Valuation (Stock adjustments, low stock badges, reserve allocation)
10. `/admin/inventory/logs` — Stock Movement Audit Trail (Reason tags, user attribution, before/after levels)
11. `/admin/categories` — Catalog Categories Management (Create, edit, reorder, image assignment)
12. `/admin/coupons` — Promotional Coupon Engine (Percentage/Fixed discounts, thresholds, validity dates)
13. `/admin/customers` — Customer CRM & Lifetime Value (Order history, VIP status, city segmentation)
14. `/admin/reviews` — Customer Feedback Moderation (Approve, reject, star ratings, verified badges)
15. `/admin/size-guides` — Size Chart Management
16. `/admin/shipping` — Shipping Rules & General Logistics Hub
17. `/admin/shipping/postex` — PostEx Logistics Command Center (API connectivity, merchant pickups, load sheets, tracking, shipper advice)
18. `/admin/shipping/cod` — COD Settlement & Reconciliation Console (CPR records, pending deposits, voucher tracking)
19. `/admin/shipping/returns` — Returns & RTO Processing Center (Return reasons, restock workflows)
20. `/admin/reports` — Financial & Commercial Analytics (Revenue trends, product sales, city breakdown)
21. `/admin/settings` — System & Store Configuration (Store info, social links, PostEx credentials, shipping thresholds, 2FA)
22. `/admin/audit-logs` — Administrative Security & Action Logs
23. `/admin/automation-logs` — Automated Courier & WhatsApp Communication Logs

### C. API Endpoints (22 Endpoints)
- **Authentication & Security:**
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `POST /api/admin/change-password`
  - `POST /api/admin/2fa/setup`
  - `POST /api/admin/2fa/verify`
  - `POST /api/admin/2fa/enable`
  - `POST /api/admin/2fa/disable`
  - `POST /api/admin/2fa/regenerate-recovery-codes`
- **Commerce Operations:**
  - `GET / POST /api/orders`
  - `POST /api/admin/orders/update-status`
  - `POST /api/admin/orders/delete`
  - `POST /api/admin/orders/notify-tracking`
  - `POST /api/coupons/validate`
  - `GET / POST / PUT / DELETE /api/admin/products`
  - `GET / POST / PUT / DELETE /api/admin/categories`
  - `GET / POST / PUT / DELETE /api/admin/collections`
  - `GET / POST / PUT / DELETE /api/admin/coupons`
  - `GET / POST /api/admin/customers`
  - `POST /api/admin/inventory/adjust`
  - `GET / POST /api/reviews`
  - `POST /api/admin/reviews/approve`
- **Logistics & PostEx Integration:**
  - `POST /api/admin/courier/postex/test-connection`
  - `GET /api/admin/courier/postex/cities`
  - `GET /api/admin/courier/postex/merchant-address`
  - `POST /api/admin/courier/postex/orders` (Dispatch creation)
  - `GET /api/admin/courier/postex/track`
  - `GET /api/admin/courier/postex/label`
  - `POST /api/admin/courier/postex/load-sheet`
  - `GET /api/admin/courier/postex/payment-status`
  - `POST /api/admin/courier/postex/shipper-advice`
  - `POST /api/admin/courier/postex/cancel`
  - `GET / POST /api/admin/courier/shipments`
  - `POST /api/admin/courier/shipments/archive`
  - `POST /api/admin/courier/shipments/delete-test`
  - `GET / POST /api/admin/shipping-rules`
- **Storefront Data & Configuration:**
  - `GET / POST /api/site-settings`
  - `GET / POST /api/track-order`
  - `GET /api/size-guides` & `POST /api/admin/size-guides`
  - `GET /api/admin/events` & `GET /api/admin/events/sse`
  - `GET /api/admin/notifications/poll` & `POST /api/admin/notifications/mark-read`
  - `GET /api/admin/automation-logs`
  - `POST /api/webhooks/postex`
  - `POST /api/webhooks/whatsapp`

---

## 3. UI Dependency Map & Invariant Blueprint

| Component | Data Source | API / Server Action | Client Mutations | Side Effects & Business Invariants |
|---|---|---|---|---|
| **Header** (`components/layout/Header.tsx`) | Server categories (`/api/admin/categories`), CartContext, WishlistContext | Search query submission (`/shop?search=...`) | Open mobile drawer, open search modal, open cart drawer | Must auto-hide on `/admin` routes. Cart & Wishlist counters must reflect real-time count. |
| **Footer** (`components/layout/Footer.tsx`) | `/api/site-settings` | None (Client links) | None | Must render dynamic WhatsApp number, social handles, support hours, COD badge. Must auto-hide on `/admin`. |
| **WhatsAppFloat** (`components/layout/WhatsAppFloat.tsx`) | `/api/site-settings` | Direct `wa.me/92...` | None | Must pull WhatsApp number dynamically. Never show on `/admin`. |
| **SupportAssistant** (`components/layout/SupportAssistant.tsx`) | In-memory conversation state machine + `/api/track-order` | `POST /api/track-order` | Toggle assistant modal, send user messages, execute tracking workflow | Must preserve two-step order lookup (Order # + Phone), interactive quick replies, direct links. |
| **HeroSlider** (`components/home/HeroSlider.tsx`) | In-memory editorial slides | None | Slide indexing, autoplay timer (6s), prefers-reduced-motion check | Must maintain mobile responsiveness, image aspect ratio, touch accessibility. |
| **ProductCard** (`components/shop/ProductCard.tsx`) | Product model props, CartContext, WishlistContext | None directly | Toggle wishlist, Quick Add (with loading/added feedback), Buy Now (immediate redirect to `/checkout`) | **CRITICAL**: Payload structure to `addToCart` must strictly maintain `productId`, `title`, `slug`, `image`, `price`, `basePrice`, `size`, `color`, `sku`, `quantity`, `maxStock`. |
| **CatalogClient** (`components/shop/CatalogClient.tsx`) | Server initial products, categories, searchParams | Client filtering & sorting | Update searchParams (category, sort, price, stock), mobile filter drawer | Must maintain all filter criteria (Price Range, In-Stock, Category, Sort by Price/Newest). |
| **ProductClient** (`app/product/[slug]/ProductClient.tsx`) | Product with variants, images, category, reviews | `POST /api/reviews` | Select active image, open lightbox, select size & color, change quantity, add to cart, buy now, review submission | Must accurately reflect variant stock, enforce quantity limits, validate review form. |
| **CartDrawer** (`components/cart/CartDrawer.tsx`) | CartContext (`cart`, `subtotal`, `appliedCoupon`) | `POST /api/coupons/validate` | Update quantity, remove item, apply coupon, clear cart, close drawer | Free shipping progress calculation (threshold = Rs. 10,000 or site settings). Correct discount and shipping calculations. |
| **CheckoutPage** (`app/checkout/page.tsx`) | CartContext, `/api/site-settings` | `POST /api/orders`, `POST /api/coupons/validate` | Input form fields, client validation, apply coupon, change quantity, remove item, submit order | **ABSOLUTE RULE**: Zero financial calculation change. Must strictly send order payload to `/api/orders` and redirect to `/order-success/[orderNumber]`. |
| **AdminLayout** (`app/admin/layout.tsx`) | AdminNotificationContext, usePathname | `POST /api/admin/logout` | Toggle mobile sidebar drawer, toggle notification center | Must hide sidebar on `/invoice`, `/packing-slip`, `/label`. Retain all 7 NAV_GROUPS. |
| **AdminDashboard** (`app/admin/dashboard/page.tsx`) | Direct Prisma queries (`Order`, `Product`, `Customer`, `Shipment`) | None (Server Component) | None | Displays live KPIs, sales pipeline, stock valuation, unsettled COD amounts. |
| **OrdersClient** (`app/admin/orders/OrdersClient.tsx`) | Orders list with pagination, search, status filters | `POST /api/admin/orders/update-status`, `POST /api/admin/orders/delete` | Filter by status, search by order # / customer, trigger delete modal, change status dropdown | Must preserve all order statuses (`PENDING`, `CONFIRMED`, `PACKING`, `DISPATCHED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`). |
| **OrderDetailClient** (`app/admin/orders/[id]/OrderDetailClient.tsx`) | Single order with items, customer, shipments | PostEx dispatch APIs, update status, notify tracking WhatsApp | Dispatch shipment, print invoice/label, cancel order, update tracking | Complete logistics integrity. Must not alter courier dispatch payload. |
| **PostExCommandCenter** (`app/admin/shipping/postex/PostExCommandCenter.tsx`) | PostEx API status, merchant pickups, load sheets | PostEx routes in `/api/admin/courier/postex/*` | Test API connection, create pickup, generate load sheets, track AWB, submit shipper advice | **ZERO REGRESSION ALLOWED**: Direct interaction with live PostEx courier systems. |
| **SettingsClient** (`app/admin/settings/SettingsClient.tsx`) | `/api/admin/settings`, `/api/admin/2fa/*` | Update site settings, setup/verify/disable TOTP 2FA | Form tabs (General, Store, Shipping, PostEx, WhatsApp, 2FA, Security) | Must preserve secure handling of 2FA secrets and API keys without leaking credentials. |

---

## 4. Design Redesign Scope Summary

1. **Design System**: Establish unified typography tokens, luxury emerald/ivory/champagne palette, grid & spacing units, micro-interactions, accessible WCAG contrast.
2. **Storefront**: Elevate Header, Announcement, Hero, Product Cards, PDP, Cart Drawer, Checkout, and Supporting Pages into an art-directed, high-fashion editorial aesthetic.
3. **Admin Operations**: Transform the Admin Portal into a sleek, ultra-crisp, high-density Commerce Operating System with unified typography, refined data tables, clear action hierarchies, and contextual status badges.
4. **Preservation**: 100% of underlying endpoints, database tables, courier webhooks, and client state managers remain active and functionally untouched.
