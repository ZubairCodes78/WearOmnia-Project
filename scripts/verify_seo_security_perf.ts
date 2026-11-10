import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { prisma } from '../lib/prisma';
import { SENSITIVE_SETTINGS_KEYS } from '../lib/settings';

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForServer(url: string, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractAllJsonLd(html: string): any[] {
  const results: any[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    results.push(JSON.parse(match[1].trim()));
  }
  return results;
}

async function fetchMeasured(path: string) {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  const text = await res.text();
  const elapsedMs = Math.round(performance.now() - start);
  const byteSize = Buffer.byteLength(text, 'utf8');
  return { status: res.status, text, elapsedMs, byteSize, headers: res.headers };
}

async function main() {
  console.log('=== WearOMNIA Phase E Verification: Catalog, SSR SEO, Schema.org, AEO & Security ===\n');

  const categories = await prisma.category.findMany({ select: { name: true, slug: true } });
  const collections = await prisma.collection.findMany({ select: { name: true, slug: true } });
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      basePrice: true,
      discountPrice: true,
      fabricDetails: true,
      inStock: true,
      stockQuantity: true,
      category: { select: { name: true, slug: true } },
      reviews: { where: { isApproved: true }, select: { id: true, rating: true } },
    },
  });

  console.log('LIVE CATALOG SNAPSHOT:');
  console.log(JSON.stringify({ categories, collections, products }, null, 2));
  console.log('');

  const nextBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const server = spawn(nextBin, ['next', 'start', '-p', String(PORT)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: { ...process.env },
  });

  try {
    await waitForServer(`${BASE_URL}/api/site-settings`, 25000);
    console.log(`Live Next.js production server listening on ${BASE_URL}\n`);

    const publicRoutes = [
      '/',
      '/shop',
      '/our-story',
      '/founder',
      '/contact',
      '/faq',
      '/size-guide',
      '/policies/shipping',
      '/policies/returns',
      '/policies/refund',
      '/policies/privacy',
      '/policies/terms',
      ...products.map((p) => `/product/${p.slug}`),
    ];

    console.log('--- 1. Public Route SSR, Meta Tags, Canonicals & JSON-LD ---');
    for (const route of publicRoutes) {
      const r = await fetchMeasured(route);
      assert.strictEqual(r.status, 200, `${route} returned HTTP ${r.status}`);
      const title = extractTag(r.text, /<title>([^<]+)<\/title>/i);
      const description =
        extractTag(r.text, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
        extractTag(r.text, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      const canonical =
        extractTag(r.text, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
        extractTag(r.text, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);

      assert(title && title.length > 5, `${route} missing <title>`);
      assert(description && description.length > 20, `${route} missing meta description`);
      assert(canonical && canonical.startsWith('https://www.wearomnia.com'), `${route} invalid canonical: ${canonical}`);

      const jsonLdBlocks = extractAllJsonLd(r.text);
      assert(
        !r.text.includes('our-story-atelier.webp') && !r.text.includes('/images/founder.png'),
        `${route} references removed legacy image asset`
      );

      if (route === '/') {
        assert(r.text.includes('founder.webp'), 'Homepage should reference optimized founder.webp');
        assert(jsonLdBlocks.length >= 2, 'Homepage missing Organization/WebSite JSON-LD');
      }

      if (route.startsWith('/product/')) {
        const slug = route.replace('/product/', '');
        const prod = products.find((p) => p.slug === slug)!;
        const productSchema = jsonLdBlocks.find(
          (b) => b['@type'] === 'Product' || b['@type'] === 'ProductGroup'
        );
        assert(productSchema, `${route} missing Product/ProductGroup JSON-LD`);
        assert(productSchema.offers?.priceCurrency === 'PKR', `${route} Product schema currency must be PKR`);
        assert(
          !JSON.stringify(productSchema.image || []).includes('images.unsplash.com'),
          `${route} Product schema should not leak Unsplash fallback image`
        );
        if (prod.reviews.length === 0) {
          assert(!productSchema.aggregateRating, `${route} must NOT emit fake aggregateRating when review count is 0`);
          assert(!r.text.includes('(0 Verified Reviews)'), `${route} must not display misleading 0 verified reviews with 5 stars`);
        }
      }

      if (route === '/faq') {
        const faqSchema = jsonLdBlocks.find((b) => b['@type'] === 'FAQPage');
        assert(faqSchema && Array.isArray(faqSchema.mainEntity) && faqSchema.mainEntity.length >= 5, '/faq missing FAQPage JSON-LD');
        assert(!r.text.includes('strictly offer Cash On Delivery'), '/faq contains outdated COD-only claim');
      }

      console.log(`PASS ${route} | 200 OK | ${(r.byteSize / 1024).toFixed(1)} KB HTML | ${r.elapsedMs}ms local SSR | JSON-LD blocks: ${jsonLdBlocks.length} | canonical: ${canonical}`);
    }

    console.log('\n--- 2. Crawling & Discovery Endpoints ---');
    const robots = await fetchMeasured('/robots.txt');
    assert.strictEqual(robots.status, 200);
    assert(robots.text.includes('Sitemap: https://www.wearomnia.com/sitemap.xml'), 'robots.txt missing sitemap');
    assert(robots.text.includes('/llms.txt'), 'robots.txt should allow /llms.txt');
    assert(robots.text.includes('Disallow: /admin/'), 'robots.txt must disallow /admin/');
    console.log(`PASS /robots.txt | ${robots.byteSize} B`);

    const sitemap = await fetchMeasured('/sitemap.xml');
    assert.strictEqual(sitemap.status, 200);
    for (const p of products) {
      assert(sitemap.text.includes(`/product/${p.slug}`), `sitemap.xml missing /product/${p.slug}`);
    }
    assert(!sitemap.text.includes('/admin'), 'sitemap.xml must not expose /admin');
    console.log(`PASS /sitemap.xml | ${sitemap.byteSize} B | includes ${products.length} published products`);

    const llms = await fetchMeasured('/llms.txt');
    assert.strictEqual(llms.status, 200);
    assert(llms.text.includes('https://www.wearomnia.com'), '/llms.txt missing domain');
    console.log(`PASS /llms.txt | ${llms.byteSize} B`);

    const founderWebp = await fetch(`${BASE_URL}/images/founder.webp`);
    assert.strictEqual(founderWebp.status, 200, '/images/founder.webp must return 200');
    const ogJpg = await fetch(`${BASE_URL}/images/og-image.jpg`);
    assert.strictEqual(ogJpg.status, 200, '/images/og-image.jpg must return 200');
    console.log('PASS /images/founder.webp & /images/og-image.jpg | 200 OK');

    console.log('\n--- 3. Live Unauthenticated Security & Secret Scrubbing Checks ---');
    const protectedEndpoints: Array<{ method: string; path: string; body?: string }> = [
      { method: 'PUT', path: '/api/admin/products', body: '{}' },
      { method: 'DELETE', path: '/api/admin/products?id=fake-id' },
      { method: 'POST', path: '/api/admin/products', body: '{}' },
      { method: 'GET', path: '/api/admin/orders' },
      { method: 'GET', path: '/api/admin/campaigns' },
      { method: 'GET', path: '/api/admin/settings' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : undefined,
        body: ep.body,
      });
      assert.strictEqual(res.status, 401, `SECURITY FAIL: ${ep.method} ${ep.path} returned ${res.status} instead of 401!`);
      console.log(`PASS ${ep.method} ${ep.path} -> 401 Unauthorized (unauthenticated)`);
    }

    const publicSettingsRes = await fetchMeasured('/api/site-settings');
    assert.strictEqual(publicSettingsRes.status, 200);
    const parsedSettings = JSON.parse(publicSettingsRes.text);
    for (const secretKey of SENSITIVE_SETTINGS_KEYS) {
      assert(
        parsedSettings.settings?.[secretKey] === undefined && !publicSettingsRes.text.includes(`"${secretKey}":`),
        `SECURITY FAIL: /api/site-settings exposed secret key ${secretKey}`
      );
    }
    console.log(`PASS GET /api/site-settings -> 200 OK (${SENSITIVE_SETTINGS_KEYS.length} secret keys stripped)`);

    console.log('\nALL PHASE E HTTP/SEO/AEO/SECURITY CHECKS PASSED.');
  } finally {
    if (process.platform === 'win32' && server.pid) {
      spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\nVERIFICATION FAILED:', err);
  process.exit(1);
});
