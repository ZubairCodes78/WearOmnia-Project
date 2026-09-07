# WEAROMNIA — ART DIRECTION & DESIGN SYSTEM DIRECTION (PHASE 2)
**Document Generated:** 2026-09-07  
**Agency Standard:** $50,000+ Luxury Fashion Maison & Commerce OS  
**Foundational Principle:** High-Fashion Editorial Luxury + Absolute Functional & Operational Safety

---

## 1. BRAND PHILOSOPHY & VISION

WearOMNIA is an haute-couture modest fashion house originating from Pakistan, marrying timeless eastern textile heritage with contemporary European editorial minimalism.

The brand does not shout with neon banners, cluttered popups, or aggressive discount timers. It commands authority through:
- **Quiet Confidence**: Generous negative space, restrained color proportion, and razor-sharp alignment.
- **Architectural Elegance**: Monolithic typographic scale, subtle depth planes, and razor-fine gold hairlines.
- **Sensory Digital Craft**: Micro-interactions that feel heavy, smooth, and tactile—like opening an embossed velvet box.

---

## 2. COLOR PALETTE SYSTEM & USAGE RULES

The brand color palette remains 100% faithful to the authentic WearOMNIA heritage:

### Color Roles & Ratios:
1. **The Canvas (70% Dominance): Alabaster Offwhite (`#FAF8F5`) & Sand (`#F4F0EA`)**
   - The storefront lives on warm, tactile offwhite. It is never stark clinical `#FFFFFF`.
   - Creates an editorial magazine parchment aesthetic that lets jewel-toned clothing pop.
2. **The Signature Ink (20% Dominance): Emerald Teal (`#103D42`) & Charcoal (`#1A1A1A`)**
   - Used for all primary headlines, navigation titles, primary purchase buttons, and structural boundaries.
   - Deepest shade `#0A2A2E` used for active button states and dark glass overlays.
3. **The Accent (10% Accent): Champagne Gold (`#DFC3A0` & `#875F34`)**
   - Used sparingly for micro-headlines, badges, verified checkmarks, active indicators, and delicate borders.
   - Gold is never gaudy; it is styled with satin opacity (`rgba(223, 195, 160, 0.4)` to `0.85`).
4. **Admin Enterprise Palette (Dark Mode):**
   - Obsidian Base: `#06191B`
   - Command Cards: `#0A2528` with hairlines in `rgba(212, 175, 55, 0.18)`
   - Imperial Gold: `#D4AF37` for active tabs, status accents, and KPI highlights.

---

## 3. TYPOGRAPHY MATRIX (THE 3-TIER LUXURY SYSTEM)

Typography is the supreme hero of the visual overhaul.

| Tier | Font Family | Weights | Intended Application | Character & Styling |
|---|---|---|---|---|
| **Tier 1: High-Fashion Serif** | `Playfair Display` (with `Cormorant Garamond` / `Georgia` fallback) | 400 (Regular), 600 (Semibold), 700 (Bold) | Hero headlines, editorial collection statements, product titles, section titles | Dramatic, high-contrast serifs, tight tracking (`tracking-tight`), editorial italic accents |
| **Tier 2: Calligraphic / Script Accent** | High-fashion editorial cursive accent (e.g. `Playfair Display` italic or decorative serif script styling) | 400 (Italic) | Micro-headlines ("The Atelier Edition", "Handcrafted in Lahore"), signatures, campaign notes | Poetic, bespoke, handcrafted signature. **Strict Rule:** NEVER used for body text, forms, numbers, or admin UI |
| **Tier 3: Bold Modern Sans** | `Jost` (Storefront) & `Poppins` / `Inter` (Admin Data) | 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold) | Navigation, prices, CTAs, data tables, variant selectors, checkout forms, numbers | Clean geometric proportions, uppercase letter-spacing (`tracking-[0.15em]` to `[0.25em]`), ultra-legible |

### Typographic Scale:
- **Hero Display:** `clamp(2.5rem, 6vw, 5.5rem)` (40px to 88px)
- **Section Heading:** `clamp(1.75rem, 3.5vw, 3rem)` (28px to 48px)
- **Product Title:** `1.125rem` to `1.5rem` (18px to 24px)
- **Editorial Sub-badge:** `0.6875rem` (11px) with `tracking-[0.25em]`
- **Price Display:** `0.875rem` to `1.75rem` bold sans with formatted commas (`Rs. 12,500`)
- **Micro / Legal:** `0.6875rem` to `0.75rem` (11px to 12px)

---

## 4. GRID, COMPOSITION & SPACING

1. **Fluid Responsive Grid:**
   - 12-column asymmetric desktop grid (`max-w-7xl` centered, `px-6 lg:px-12`).
   - Break from standard uniform squares: introduce editorial hero spreads, 60/40 offset columns, and staggered lookbook cards.
2. **Generous Whitespace Hierarchy:**
   - Section vertical cadence: `py-20 lg:py-32` (giving high-fashion imagery room to breathe).
   - Card internal padding: `p-6` to `p-8`.
   - Micro-element spacing: `gap-3` to `gap-4`.

---

## 5. 3D & DEPTH PHILOSOPHY

**Guiding Rule:** 3D is used strictly for **tactile luxury materialization**, never gratuitous gimmickry. Core Web Vitals and 60fps mobile performance are uncompromised.

### Applications:
1. **Interactive Product Hover Tilt (CSS 3D / Framer Motion):**
   - Cards subtly react to mouse position (`rotateX`, `rotateY` clamped to `±4deg`) with light glare sheen (`transform-style: preserve-3d`).
2. **Multi-Plane Editorial Parallax:**
   - Background editorial typography scrolls at 0.8x speed behind foreground garment photography.
3. **Layered Tactile Glassmorphism:**
   - Floating action bars, drawers, and modal overlays use multi-stop backdrop blur (`backdrop-filter: blur(16px)`), sub-pixel gold rim borders, and deep soft ambient occlusion shadows (`box-shadow: 0 20px 50px rgba(16, 61, 66, 0.12)`).

---

## 6. MOTION DESIGN & CHOREOGRAPHY

1. **Duration & Easing Tokens:**
   - `--ease-luxury: cubic-bezier(0.16, 1, 0.3, 1)` (snappy entry, ultra-smooth decelerated landing).
   - Standard transitions: `300ms` for micro-interactions; `600ms` to `900ms` for editorial reveals.
2. **Choreographed Reveals:**
   - Text headers clip-path wipe or fade-up by word/line.
   - Image cards reveal with smooth scale-down from `scale(1.04)` to `scale(1)`.
3. **Reduced Motion:**
   - `@media (prefers-reduced-motion: reduce)` instantly disables transforms and defaults to simple 100ms crossfades.

---

## 7. STOREFRONT COMPONENT DESIGN LANGUAGE

### A. Product Cards
- **Form:** Sleek portrait ratio (`aspect-[3/4]`), ultra-fine border (`border-sand/60`), border-radius `rounded-2xl`.
- **Interactions:**
  - Dual-image crossfade on hover (front view → editorial drape/detail view).
  - Floating minimal wishlist button with heart morph animation.
  - Hover action bar: Quick View & Add to Bag appearing with smooth upward slide.
  - Instant COD Checkout button with one-tap express purchase.

### B. Buttons & Interactive Controls
- **Primary CTA (`.btn-luxury-teal`):** Deep Teal background (`#103D42`), champagne gold text (`#DFC3A0`), uppercase bold sans, `rounded-xl`, tracking `0.15em`, hover elevation with subtle gold shadow.
- **Secondary CTA (`.btn-luxury-outline`):** Transparent background, 1px teal border, smooth fill transition.
- **Champagne Instant Action (`.btn-luxury-gold`):** Champagne gold background, teal-950 text, for instant checkout.

### C. Form Fields & Inputs
- **Treatment:** Warm sand background (`bg-sand/40`), border `border-sand`, focus state glowing in emerald teal (`ring-1 ring-teal/30 border-teal`). Floating labels or crisp uppercase micro-headers.

### D. Drawers & Modals
- **Cart Drawer & Filter Drawer:** Pinned to right, 440px width on desktop, 100% on mobile. Glass header, tactile item list, live free-shipping progress meter with gold shimmer.

---

## 8. ADMIN COMMERCE OPERATING SYSTEM (ADMIN DESIGN LANGUAGE)

The admin panel is treated as an **enterprise-grade operations command center** for high-volume Pakistani commerce:
1. **Palette:** Obsidian Emerald (`#06191B`), slate surface (`#0A2528`), muted imperial gold accents (`#D4AF37`), emerald success badges (`#10B981`), rose return badges (`#F43F5E`), amber pending badges (`#F59E0B`).
2. **Typography:** Crisp Poppins / Inter, high density tabular numerals (`font-mono font-bold`), clean table headers with tracking.
3. **Data Tables:** Zebra-less, subtle divider lines, hover row illumination, fixed header scrolling, inline status badges.
4. **Logistics & PostEx:** Dedicated Courier Command Center with visual status pipeline, load sheet barcode generators, and 1-click AWB dispatch.

---

## 9. MOBILE UX & RESPONSIVE RULES

Tested viewports: `320px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1440px`.
1. **Thumb-Zone Optimization:** Bottom-sheet drawers for filters and cart, sticky bottom purchase bar on product pages with single-tap COD checkout.
2. **Touch Targets:** Minimum `44px x 44px` for all clickable elements.
3. **Zero Horizontal Overflow:** Strict containment with `overflow-x: hidden` and fluid container widths.
4. **Floating Tools Safe Area:** Proper z-index and spacing offsets between WhatsApp floating button, support assistant, and bottom safe-area insets (`pb-safe`).

---

## 10. PRESERVATION OF SACRED BUSINESS LOGIC

| System Component | Strict Invariant |
|---|---|
| **Database & Prisma** | No schema edits. All models (`Order`, `Product`, `Variant`, `Shipment`, etc.) unchanged. |
| **Authentication & 2FA** | Bcrypt passwords, TOTP secret verification, recovery codes untouched. |
| **PostEx Courier APIs** | Dispatch creation, tracking polling, load sheets, shipper advice payload intact. |
| **Checkout & Calculations** | Subtotal, discounts, shipping thresholds, COD fees, tax formulas 100% identical. |
| **WhatsApp & Support** | Real customer phone numbers (`03180633323`), direct wa.me links, two-step tracking bot intact. |
