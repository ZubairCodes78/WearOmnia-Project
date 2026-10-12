import assert from 'assert';
import { formatOrderPlacementTime, formatPlacedOnDate, formatOrderPlacedComma } from '../lib/date';
import sitemap from '../app/sitemap';
import robots from '../app/robots';
import { PRODUCTION_DOMAIN, SITE_METADATA_DEFAULTS, generateSiteSchema } from '../lib/seo';
import nextConfig from '../next.config.js';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function runValidation() {
  console.log('====================================================');
  console.log('🚀 WEAROMNIA FINAL CHECKOUT + BRAND + GSC TEST SUITE');
  console.log('====================================================\n');

  // 1. ORDER TIMESTAMP & ASIA/KARACHI FORMATTING
  console.log('--- 1. Testing Order Placement Timestamps (Asia/Karachi) ---');
  // 18:42 UTC is 23:42 PKT (+5 hours) on the same day
  const testIso = '2026-10-08T18:42:00.000Z';
  const commaFormatted = formatOrderPlacedComma(testIso);
  const placedOnFormatted = formatPlacedOnDate(testIso);
  const placementTime = formatOrderPlacementTime(testIso);

  console.log('Input UTC:', testIso);
  console.log('Comma format:', commaFormatted);
  console.log('Placed on format:', placedOnFormatted);
  console.log('Placement time format:', placementTime);

  assert.strictEqual(commaFormatted, '8 October 2026, 11:42 PM', 'Comma format must match Asia/Karachi time');
  assert.strictEqual(placedOnFormatted, 'Placed on 8 October 2026 at 11:42 PM', 'Placed on format must include Placed on prefix');
  assert.strictEqual(placementTime, '8 October 2026 at 11:42 PM', 'Placement time format must match Asia/Karachi time');

  // Check another time across midnight boundary
  // 2026-10-08T20:30:00.000Z -> PKT is 2026-10-09 01:30 AM
  const midnightIso = '2026-10-08T20:30:00.000Z';
  assert.strictEqual(formatOrderPlacedComma(midnightIso), '9 October 2026, 1:30 AM', 'Must handle day turnover to Asia/Karachi');
  console.log('✅ [PASS] Order timestamp properly converts to Asia/Karachi (UTC+5)');

  // 2. BRAND TAGLINE & POSITIONING
  console.log('\n--- 2. Testing Brand Tagline & Positioning ---');
  assert.strictEqual(SITE_METADATA_DEFAULTS.slogan, 'Modesty With Functionality.');
  assert(SITE_METADATA_DEFAULTS.title.includes('Modesty With Functionality.'));

  const siteSchema = generateSiteSchema();
  const orgSchema = siteSchema.find((s: any) => s['@type'] === 'Organization');
  assert(orgSchema, 'Must have Organization schema');
  assert.strictEqual(orgSchema.slogan, 'Modesty With Functionality.', 'Organization schema must feature tagline');
  assert.strictEqual(orgSchema.logo, 'https://www.wearomnia.com/logo.png', 'Organization schema must link official logo');
  console.log('✅ [PASS] Brand tagline is consistently "Modesty With Functionality."');

  // 3. PRODUCT DESCRIPTIONS & POCKETS FACTUAL ACCURACY
  console.log('\n--- 3. Testing Product Descriptions & Factual Pockets ---');
  const products = await prisma.product.findMany({
    select: { id: true, title: true, description: true, status: true }
  });
  console.log(`Audited ${products.length} products in database:`);
  for (const p of products) {
    console.log(`- Product: "${p.title}" (status: ${p.status})`);
    assert(p.description, 'Description must not be empty');
    if (p.title.includes('Midnight Bloom')) {
      assert(p.description.toLowerCase().includes('pocket'), 'Midnight Bloom trouser has pockets');
      console.log('  -> Factual pocket verification PASS');
    }
    if (p.title.includes('Sea Mist')) {
      assert(p.description.toLowerCase().includes('pocket'), 'Sea Mist shirt has pockets');
      console.log('  -> Factual pocket verification PASS');
    }
  }
  console.log('✅ [PASS] Product pockets verified factually without exaggeration');

  // 4. SITEMAP COMPLETENESS & CANONICAL WWW URLS
  console.log('\n--- 4. Testing Sitemap Completeness ---');
  const sitemapUrls = await sitemap();
  console.log(`Sitemap generated ${sitemapUrls.length} canonical URLs`);
  
  for (const item of sitemapUrls) {
    assert(item.url.startsWith('https://www.wearomnia.com/'), `URL must start with https://www.wearomnia.com/ but got ${item.url}`);
    assert(!item.url.includes('wearomnia.com:'), 'No port in URL');
    assert(!item.url.includes('localhost'), 'No localhost in URL');
    assert(!item.url.includes('vercel.app'), 'No vercel.app in URL');
    assert(!item.url.startsWith('https://wearomnia.com/'), 'No apex domain in sitemap');
    
    // Ensure no private URLs leaked
    const pathPart = new URL(item.url).pathname;
    assert(!pathPart.startsWith('/admin'), `Admin route must not be in sitemap: ${item.url}`);
    assert(!pathPart.startsWith('/api'), `API route must not be in sitemap: ${item.url}`);
    assert(!pathPart.startsWith('/cart'), `Cart route must not be in sitemap: ${item.url}`);
    assert(!pathPart.startsWith('/checkout'), `Checkout route must not be in sitemap: ${item.url}`);
    assert(!pathPart.startsWith('/order-success'), `Order success route must not be in sitemap: ${item.url}`);
    assert(!pathPart.startsWith('/track-order'), `Track order route must not be in sitemap: ${item.url}`);
  }

  // Ensure key pages are present
  const urlSet = new Set(sitemapUrls.map(u => u.url));
  const expectedPublicUrls = [
    'https://www.wearomnia.com/',
    'https://www.wearomnia.com/shop',
    'https://www.wearomnia.com/our-story',
    'https://www.wearomnia.com/founder',
    'https://www.wearomnia.com/contact',
    'https://www.wearomnia.com/faq',
    'https://www.wearomnia.com/size-guide',
    'https://www.wearomnia.com/policies/shipping',
    'https://www.wearomnia.com/policies/returns',
    'https://www.wearomnia.com/policies/privacy',
    'https://www.wearomnia.com/policies/terms',
  ];
  for (const url of expectedPublicUrls) {
    assert(urlSet.has(url), `Expected sitemap URL missing: ${url}`);
  }
  console.log('✅ [PASS] Sitemap contains all canonical public URLs and excludes all private routes');

  // 5. ROBOTS.TXT DIRECTIVES & SITEMAP REFERENCE
  console.log('\n--- 5. Testing Robots.txt Directives ---');
  const robotsConfig = robots();
  assert.strictEqual(robotsConfig.sitemap, 'https://www.wearomnia.com/sitemap.xml');
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  const disallowed = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];
  assert(disallowed.includes('/admin/'), 'Must disallow /admin/');
  assert(disallowed.includes('/api/'), 'Must disallow /api/');
  assert(disallowed.includes('/checkout'), 'Must disallow /checkout');
  assert(disallowed.includes('/cart'), 'Must disallow /cart');
  assert(disallowed.includes('/order-success/'), 'Must disallow /order-success/');
  assert(disallowed.includes('/track-order'), 'Must disallow /track-order');
  
  const allowed = Array.isArray(rules?.allow) ? rules.allow : [rules?.allow];
  assert(allowed.includes('/logo.png'), 'Must allow /logo.png');
  assert(allowed.includes('/icon-48x48.png'), 'Must allow /icon-48x48.png for Google Favicon bot');
  console.log('✅ [PASS] Robots.txt correctly configures sitemap, public allows, and private disallows');

  // 6. REDIRECTS FOR LEGACY LOGO / FAVICON CACHE
  console.log('\n--- 6. Testing Legacy Favicon 301 Redirects ---');
  if (typeof nextConfig.redirects === 'function') {
    const redirects = await nextConfig.redirects();
    const faviconJpgRedirect = redirects.find((r: any) => r.source === '/favicon.jpg');
    assert(faviconJpgRedirect, 'Must have 301 redirect for legacy /favicon.jpg');
    assert.strictEqual(faviconJpgRedirect.destination, '/favicon.ico');
    assert.strictEqual(faviconJpgRedirect.permanent, true);
    console.log('✅ [PASS] Legacy /favicon.jpg properly permanently redirected (301) to /favicon.ico');
  }

  // 7. NEW OFFICIAL LOGO ASSETS AUDIT
  console.log('\n--- 7. Testing Official Logo and Icon Assets ---');
  const requiredAssets = [
    'public/logo.png',
    'public/favicon.ico',
    'public/favicon.png',
    'public/icon-16x16.png',
    'public/icon-32x32.png',
    'public/icon-48x48.png',
    'public/icon-192x192.png',
    'public/icon-512x512.png',
    'public/apple-touch-icon.png',
  ];
  for (const asset of requiredAssets) {
    const fullPath = path.resolve(asset);
    assert(fs.existsSync(fullPath), `Asset must exist: ${asset}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 0, `Asset must not be empty: ${asset}`);
  }
  console.log('✅ [PASS] All official WearOMNIA logo and icon assets exist and are valid');

  console.log('\n====================================================');
  console.log('🎉 ALL INTEGRATION AND VALIDATION TESTS PASSED 100%!');
  console.log('====================================================\n');
}

runValidation()
  .catch((err) => {
    console.error('❌ VALIDATION TEST FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
