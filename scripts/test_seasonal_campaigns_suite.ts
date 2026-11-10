import { NextRequest } from 'next/server';
import { prisma } from '../lib/prisma';
import { getSiteSettings, getPreOrderSettings } from '../lib/settings';
import { calculatePreOrderAmounts } from '../lib/preorder';
import { savePaymentProof, deleteFile } from '../lib/storage';
import { getCampaignAnalytics } from '../lib/campaign-analytics';
import {
  getEffectiveCampaignPhase,
  resolveProductCampaignPricing,
  calculateCampaignUnitDiscount,
  calculateServerCartQuote,
} from '../lib/campaigns';
import { GET as getAdminCampaigns, POST as postAdminCampaign } from '../app/api/admin/campaigns/route';
import {
  GET as getAdminCampaignDetail,
  PATCH as patchAdminCampaign,
  DELETE as deleteAdminCampaign,
} from '../app/api/admin/campaigns/[id]/route';
import { GET as getActiveCampaignsApi } from '../app/api/campaigns/active/route';
import { POST as priceCheckApi } from '../app/api/checkout/price-check/route';
import { POST as validateCouponApi } from '../app/api/coupons/validate/route';
import { POST as createRegularOrderApi } from '../app/api/orders/route';
import { POST as createPreOrderApi } from '../app/api/preorder/checkout/route';
import { POST as uploadCampaignAssetApi } from '../app/api/admin/campaigns/upload-asset/route';

async function runSuite() {
  console.log('==================================================================');
  console.log('SEASONAL SALE & CAMPAIGN MANAGEMENT SYSTEM — REAL TEST SUITE');
  console.log('==================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, detail?: string) {
    total++;
    if (cond) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
      throw new Error(`Assertion failed: ${name}${detail ? ` (${detail})` : ''}`);
    }
  }

  const ts = Date.now();
  const createdCampaignIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdCollectionIds: string[] = [];
  const createdCouponCodes: string[] = [];
  const createdOrderIds: string[] = [];
  const createdCustomerIds: string[] = [];
  const createdProofKeys: string[] = [];
  let createdMethodId: string | null = null;

  try {
    // ------------------------------------------------------------------
    // Setup Fixtures
    // ------------------------------------------------------------------
    const admin = await prisma.admin.findFirst();
    assert(Boolean(admin?.id), 'Admin account exists in database for auth tests');
    const adminId = admin!.id;

    const makeAdminReq = (url: string, method: string, body?: any) =>
      new NextRequest(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminId,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

    const makePublicReq = (url: string, method: string, body?: any) =>
      new NextRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

    // Ensure active payment method for full advance & pre-order checkouts
    let paymentMethod = await prisma.preOrderPaymentMethod.findFirst({ where: { isActive: true } });
    if (!paymentMethod) {
      paymentMethod = await prisma.preOrderPaymentMethod.create({
        data: {
          displayName: 'Test Campaign Bank',
          methodType: 'BANK_TRANSFER',
          bankName: 'Meezan',
          accountTitle: 'WearOMNIA Test',
          accountNumber: '000011112222',
          isActive: true,
        },
      });
      createdMethodId = paymentMethod.id;
    }

    // Create sample payment proof via real storage helper
    const proofRes = await savePaymentProof(Buffer.from('PNG_CAMPAIGN_TEST_DATA'), 'image/png');
    assert(Boolean(proofRes.success && proofRes.filename), 'Payment proof fixture saved');
    createdProofKeys.push(proofRes.filename!);

    // Create Category & Collection
    const testCategory = await prisma.category.create({
      data: {
        name: `Test Campaign Cat ${ts}`,
        slug: `test-camp-cat-${ts}`,
      },
    });
    createdCategoryIds.push(testCategory.id);

    const testCollection = await prisma.collection.create({
      data: {
        name: `Test Campaign Col ${ts}`,
        slug: `test-camp-col-${ts}`,
      },
    });
    createdCollectionIds.push(testCollection.id);

    // Regular Product A (Rs. 5000), Regular Product B (Rs. 4000), PreOrder Product C (Rs. 6000)
    const prodA = await prisma.product.create({
      data: {
        title: `Seasonal Silk Kurta ${ts}`,
        slug: `seasonal-silk-kurta-${ts}`,
        description: 'Test product A',
        basePrice: 5000,
        sku: `CAMP-A-${ts}`,
        isPreOrder: false,
        inStock: true,
        stockQuantity: 25,
        categoryId: testCategory.id,
        collectionId: testCollection.id,
        variants: {
          create: [{ size: 'M', color: 'Teal', sku: `CAMP-A-M-${ts}`, stock: 25 }],
        },
      },
    });
    createdProductIds.push(prodA.id);

    const prodB = await prisma.product.create({
      data: {
        title: `Seasonal Excluded Dress ${ts}`,
        slug: `seasonal-excluded-dress-${ts}`,
        description: 'Test product B',
        basePrice: 4000,
        sku: `CAMP-B-${ts}`,
        isPreOrder: false,
        inStock: true,
        stockQuantity: 25,
        categoryId: testCategory.id,
        variants: {
          create: [{ size: 'L', color: 'Sand', sku: `CAMP-B-L-${ts}`, stock: 25 }],
        },
      },
    });
    createdProductIds.push(prodB.id);

    const prodPreOrder = await prisma.product.create({
      data: {
        title: `Seasonal PreOrder Kaftan ${ts}`,
        slug: `seasonal-preorder-kaftan-${ts}`,
        description: 'Test pre-order product',
        basePrice: 6000,
        sku: `CAMP-PO-${ts}`,
        isPreOrder: true,
        preOrderAdvancePercent: 50,
        inStock: true,
        stockQuantity: 15,
        collectionId: testCollection.id,
        variants: {
          create: [{ size: 'M', color: 'Champagne', sku: `CAMP-PO-M-${ts}`, stock: 15 }],
        },
      },
    });
    createdProductIds.push(prodPreOrder.id);

    // Create Test Coupon (25% OFF, max 2000)
    const couponCode = `TESTCAMP${String(ts).slice(-4)}`;
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minOrderAmount: 1000,
        maxDiscountAmount: 2000,
        isActive: true,
      },
    });
    createdCouponCodes.push(couponCode);

    // ------------------------------------------------------------------
    // TEST 16: Admin Permissions (Unauthorized blocked, Authorized allowed)
    // ------------------------------------------------------------------
    console.log('\n--- Test 16: Admin Permissions & Auth Guards ---');
    const unauthGet = await getAdminCampaigns(makePublicReq('http://localhost/api/admin/campaigns', 'GET'));
    assert(unauthGet.status === 401, 'Unauthenticated GET /api/admin/campaigns returns 401');

    const unauthPost = await postAdminCampaign(
      makePublicReq('http://localhost/api/admin/campaigns', 'POST', { name: 'Hack', publicTitle: 'Hack', slug: 'hack' })
    );
    assert(unauthPost.status === 401, 'Unauthenticated POST /api/admin/campaigns returns 401');

    const unauthUpload = await uploadCampaignAssetApi(
      new NextRequest('http://localhost/api/admin/campaigns/upload-asset', { method: 'POST' })
    );
    assert(unauthUpload.status === 401, 'Unauthenticated asset upload returns 401');

    // ------------------------------------------------------------------
    // TEST 1: Create Draft Campaign + Preview Token + Duplicate + Invalid Rules
    // ------------------------------------------------------------------
    console.log('\n--- Test 1: Draft Campaign, Validation & Duplication ---');
    const invalidPctRes = await postAdminCampaign(
      makeAdminReq('http://localhost/api/admin/campaigns', 'POST', {
        name: 'Bad Campaign',
        publicTitle: 'Bad',
        slug: `bad-${ts}`,
        discountType: 'PERCENTAGE',
        discountValue: 120,
      })
    );
    assert(invalidPctRes.status === 400, 'Rejects invalid >95% discount value');

    const draftSlug = `draft-eid-${ts}`;
    const draftRes = await postAdminCampaign(
      makeAdminReq('http://localhost/api/admin/campaigns', 'POST', {
        name: `Draft Eid Edit ${ts}`,
        publicTitle: 'Eid Signature Sale',
        slug: draftSlug,
        status: 'DRAFT',
        scopeType: 'SELECTED_PRODUCTS',
        includedProductIds: [prodA.id],
        discountType: 'PERCENTAGE',
        discountValue: 20,
        desktopBannerUrl: 'https://cdn.example.com/desktop.webp',
        mobileBannerUrl: 'https://cdn.example.com/mobile.webp',
      })
    );
    const draftJson = await draftRes.json();
    assert(draftRes.status === 200 && draftJson.success, 'Draft campaign created via Admin API');
    createdCampaignIds.push(draftJson.campaign.id);
    assert(Boolean(draftJson.campaign.previewToken), 'Draft campaign generated preview token');
    assert(draftJson.campaign.effectiveStatus === 'DRAFT' && !draftJson.campaign.isLive, 'Draft campaign is NOT live');

    const activePublicCheck1 = await (await getActiveCampaignsApi()).json();
    assert(
      !activePublicCheck1.campaigns.some((c: any) => c.id === draftJson.campaign.id),
      'Draft campaign excluded from public /api/campaigns/active'
    );

    const dupRes = await postAdminCampaign(
      makeAdminReq('http://localhost/api/admin/campaigns', 'POST', {
        action: 'DUPLICATE',
        id: draftJson.campaign.id,
      })
    );
    const dupJson = await dupRes.json();
    assert(dupRes.status === 200 && dupJson.campaign.status === 'DRAFT', 'Duplicate creates safe DRAFT copy');
    createdCampaignIds.push(dupJson.campaign.id);

    // ------------------------------------------------------------------
    // TEST 2, 3, 4: Scheduling, Automatic Activation, Automatic Expiry
    // ------------------------------------------------------------------
    console.log('\n--- Tests 2, 3, 4: Schedule Future -> Auto-Activate -> Auto-Expire ---');
    const nowMs = Date.now();
    const futureStart = new Date(nowMs + 3600_000); // +1 hr
    const futureEnd = new Date(nowMs + 7200_000); // +2 hr
    const schedSlug = `11-11-test-${ts}`;

    const schedRes = await postAdminCampaign(
      makeAdminReq('http://localhost/api/admin/campaigns', 'POST', {
        name: `11.11 Auto Schedule ${ts}`,
        publicTitle: '11.11 Flash Sale',
        slug: schedSlug,
        status: 'SCHEDULED',
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        scopeType: 'SELECTED_PRODUCTS',
        includedProductIds: [prodA.id],
        discountType: 'PERCENTAGE',
        discountValue: 20,
      })
    );
    const schedJson = await schedRes.json();
    assert(schedRes.status === 200, 'Scheduled campaign created');
    createdCampaignIds.push(schedJson.campaign.id);

    const phaseBeforeStart = getEffectiveCampaignPhase(schedJson.campaign, new Date(nowMs));
    assert(phaseBeforeStart.effectiveStatus === 'SCHEDULED' && !phaseBeforeStart.isLive, 'Scheduled campaign is inactive before startDate');

    const phaseAfterStart = getEffectiveCampaignPhase(schedJson.campaign, new Date(nowMs + 3700_000));
    assert(phaseAfterStart.effectiveStatus === 'ACTIVE' && phaseAfterStart.isLive, 'Scheduled campaign AUTOMATICALLY activates once server time crosses startDate');

    const phaseAfterEnd = getEffectiveCampaignPhase(schedJson.campaign, new Date(nowMs + 7300_000));
    assert(phaseAfterEnd.effectiveStatus === 'COMPLETED' && !phaseAfterEnd.isLive, 'Campaign AUTOMATICALLY expires immediately once server time passes endDate');

    // Verify real DB activation on a time-triggered campaign starting 2 seconds in the past
    await patchAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${schedJson.campaign.id}`, 'PATCH', {
        startDate: new Date(Date.now() - 5000).toISOString(),
        endDate: new Date(Date.now() + 600_000).toISOString(),
      }),
      { params: Promise.resolve({ id: schedJson.campaign.id }) }
    );
    const liveCheck2 = await (await getActiveCampaignsApi()).json();
    assert(
      liveCheck2.campaigns.some((c: any) => c.id === schedJson.campaign.id),
      'Scheduled campaign with startDate in past & status=SCHEDULED is LIVE immediately in /api/campaigns/active'
    );

    // ------------------------------------------------------------------
    // TEST 5: Pause & Resume
    // ------------------------------------------------------------------
    console.log('\n--- Test 5: Pause & Resume ---');
    const pauseRes = await patchAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${schedJson.campaign.id}`, 'PATCH', {
        action: 'PAUSE',
      }),
      { params: Promise.resolve({ id: schedJson.campaign.id }) }
    );
    const pauseJson = await pauseRes.json();
    assert(pauseJson.campaign.status === 'PAUSED' && !pauseJson.campaign.isLive, 'Paused campaign halts immediately');

    const resumeRes = await patchAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${schedJson.campaign.id}`, 'PATCH', {
        action: 'RESUME',
      }),
      { params: Promise.resolve({ id: schedJson.campaign.id }) }
    );
    const resumeJson = await resumeRes.json();
    assert(resumeJson.campaign.isLive, 'Resumed campaign restores active state inside schedule window');

    // ------------------------------------------------------------------
    // TEST 6, 7, 8, 14: Product-Specific, Storewide w/ Exclusions, Percentage+Cap, Fixed (no negative), Overlap Priority
    // ------------------------------------------------------------------
    console.log('\n--- Tests 6, 7, 8, 14: Scope, Discount Caps, Non-Negative Guard, Overlap Priority ---');
    // Campaign 1 (schedJson): Priority 10, 20% off prodA -> Rs. 5000 * 0.8 = Rs. 4000. prodB unaffected!
    const q1 = await calculateServerCartQuote({
      items: [
        { productId: prodA.id, quantity: 1 },
        { productId: prodB.id, quantity: 1 },
      ],
      isPreOrderOrder: false,
    });
    assert(q1.items[0].unitPrice === 4000, `Product-specific discount applied to prodA (got ${q1.items[0].unitPrice})`);
    assert(q1.items[1].unitPrice === 4000 && !q1.items[1].campaignId, 'Non-included prodB remains untouched');

    // Create overlapping Storewide campaign (Priority 50, Fixed Rs. 1500 OFF, excluding prodB)
    const storewideRes = await postAdminCampaign(
      makeAdminReq('http://localhost/api/admin/campaigns', 'POST', {
        name: `Storewide Priority Sale ${ts}`,
        publicTitle: 'Storewide Gold Sale',
        slug: `storewide-${ts}`,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 5000).toISOString(),
        endDate: new Date(Date.now() + 600_000).toISOString(),
        priority: 50,
        scopeType: 'STOREWIDE',
        excludedProductIds: [prodB.id],
        discountType: 'FIXED',
        discountValue: 1500,
        couponStackingMode: 'BLOCK_COUPONS',
      })
    );
    const storewideJson = await storewideRes.json();
    assert(storewideRes.status === 200, 'Storewide campaign created');
    createdCampaignIds.push(storewideJson.campaign.id);

    const qOverlap = await calculateServerCartQuote({
      items: [
        { productId: prodA.id, quantity: 1 },
        { productId: prodB.id, quantity: 1 },
      ],
      isPreOrderOrder: false,
    });
    // prodA matches BOTH Priority 10 (20% = 4000) and Priority 50 (Rs. 1500 off = 3500).
    // Priority 50 MUST win cleanly WITHOUT double-discounting!
    assert(
      qOverlap.items[0].unitPrice === 3500 && qOverlap.items[0].campaignId === storewideJson.campaign.id,
      `Higher-priority overlapping campaign won without double-discount (got Rs. ${qOverlap.items[0].unitPrice})`
    );
    assert(
      qOverlap.items[1].unitPrice === 4000 && !qOverlap.items[1].campaignId,
      'Excluded product prodB was skipped even under STOREWIDE scope'
    );

    // Fixed discount > basePrice must clamp to 0 (NEVER negative)
    const nonNeg = calculateCampaignUnitDiscount(1000, {
      discountType: 'FIXED',
      discountValue: 5000,
      maxDiscountAmount: null,
    });
    assert(nonNeg.discountedPrice === 0 && nonNeg.discountOffBase === 1000, 'Excessive fixed discount clamped safely to Rs. 0 (never negative)');

    // Percentage discount with maxDiscountAmount cap
    const cappedPct = calculateCampaignUnitDiscount(10000, {
      discountType: 'PERCENTAGE',
      discountValue: 50,
      maxDiscountAmount: 1200,
    });
    assert(cappedPct.discountedPrice === 8800 && cappedPct.discountOffBase === 1200, 'Percentage discount honors optional maxDiscountAmount cap');

    // ------------------------------------------------------------------
    // TEST 9: Coupon Conflict & Stacking Modes
    // ------------------------------------------------------------------
    console.log('\n--- Test 9: Coupon Stacking Policies ---');
    // Under BLOCK_COUPONS, couponCode must be blocked
    const blockValidateRes = await validateCouponApi(
      makePublicReq('http://localhost/api/coupons/validate', 'POST', {
        code: couponCode,
        isPreOrder: false,
        items: [{ productId: prodA.id, quantity: 1 }],
      })
    );
    assert(blockValidateRes.status === 400, 'BLOCK_COUPONS blocks stacking coupon with active campaign discount');

    // Switch storewide campaign to BEST_DISCOUNT_ONLY (Campaign saves 1500 vs Coupon 25% of 5000 = 1250 -> Campaign wins)
    await patchAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${storewideJson.campaign.id}`, 'PATCH', {
        couponStackingMode: 'BEST_DISCOUNT_ONLY',
      }),
      { params: Promise.resolve({ id: storewideJson.campaign.id }) }
    );
    const qBestCampaignWins = await calculateServerCartQuote({
      items: [{ productId: prodA.id, quantity: 1 }],
      couponCode,
      isPreOrderOrder: false,
    });
    assert(
      qBestCampaignWins.stackingResolution === 'CAMPAIGN_WINS' &&
        qBestCampaignWins.campaignDiscountAmount === 1500 &&
        qBestCampaignWins.couponDiscountAmount === 0,
      'BEST_DISCOUNT_ONLY keeps campaign when campaign (1500) > coupon (1250)'
    );

    // Qty 2 of prodA: Campaign = 3000, Coupon 25% of 10000 capped at 2000 -> wait: test discount 500 campaign vs 1250 coupon!
    await patchAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${storewideJson.campaign.id}`, 'PATCH', {
        discountValue: 500,
      }),
      { params: Promise.resolve({ id: storewideJson.campaign.id }) }
    );
    const qBestCouponWins = await calculateServerCartQuote({
      items: [{ productId: prodA.id, quantity: 1 }],
      couponCode,
      isPreOrderOrder: false,
    });
    assert(
      qBestCouponWins.stackingResolution === 'COUPON_WINS' &&
        qBestCouponWins.couponDiscountAmount === 1250 &&
        qBestCouponWins.campaignDiscountAmount === 0,
      'BEST_DISCOUNT_ONLY switches to coupon (1250) when coupon > campaign (500), never double-dipping'
    );

    // Switch to ALLOW_COUPONS (discountValue back to 1000 -> price 4000 -> 25% coupon = 1000 -> final net 3000)
    await patchAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${storewideJson.campaign.id}`, 'PATCH', {
        discountValue: 1000,
        couponStackingMode: 'ALLOW_COUPONS',
      }),
      { params: Promise.resolve({ id: storewideJson.campaign.id }) }
    );
    const qStacked = await calculateServerCartQuote({
      items: [{ productId: prodA.id, quantity: 1 }],
      couponCode,
      isPreOrderOrder: false,
    });
    assert(
      qStacked.stackingResolution === 'STACKED' &&
        qStacked.subtotal === 4000 &&
        qStacked.couponDiscountAmount === 1000 &&
        qStacked.campaignDiscountAmount === 1000,
      'ALLOW_COUPONS stacks coupon onto post-campaign subtotal cleanly'
    );

    // ------------------------------------------------------------------
    // TEST 10: Pre-Order Exclusion & Explicit Eligibility
    // ------------------------------------------------------------------
    console.log('\n--- Test 10: Pre-Order Exclusion vs Eligibility ---');
    // storewideJson has allowPreOrderProducts=false -> prodPreOrder (6000) gets NO campaign discount!
    const qPreOrderExcluded = await calculateServerCartQuote({
      items: [{ productId: prodPreOrder.id, quantity: 1 }],
      isPreOrderOrder: true,
    });
    assert(
      qPreOrderExcluded.items[0].unitPrice === 6000 && !qPreOrderExcluded.items[0].campaignId,
      'Pre-order product excluded from storewide campaign when allowPreOrderProducts=false'
    );

    // Explicit opt-in on collection campaign -> allowPreOrderProducts=true + BLOCK_COUPONS (no silent stacking with PREORDER500)
    const poCampRes = await postAdminCampaign(
      makeAdminReq('http://localhost/api/admin/campaigns', 'POST', {
        name: `PreOrder Eligible Collection Sale ${ts}`,
        publicTitle: 'Pre-Order Celebration Edit',
        slug: `po-edit-${ts}`,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 5000).toISOString(),
        endDate: new Date(Date.now() + 600_000).toISOString(),
        priority: 100,
        scopeType: 'COLLECTIONS',
        includedCollectionIds: [testCollection.id],
        allowPreOrderProducts: true,
        couponStackingMode: 'BLOCK_COUPONS',
        discountType: 'FIXED',
        discountValue: 1000,
      })
    );
    const poCampJson = await poCampRes.json();
    assert(poCampRes.status === 200, 'Collection campaign with explicit pre-order opt-in created');
    createdCampaignIds.push(poCampJson.campaign.id);

    const qPreOrderOptIn = await calculateServerCartQuote({
      items: [{ productId: prodPreOrder.id, quantity: 1 }],
      couponCode: 'PREORDER500',
      isPreOrderOrder: true,
    });
    assert(
      qPreOrderOptIn.items[0].unitPrice === 5000 &&
        qPreOrderOptIn.campaignDiscountAmount === 1000 &&
        qPreOrderOptIn.couponDiscountAmount === 0,
      'Pre-order opt-in campaign applies Rs. 1000 discount and blocks silent stacking with PREORDER500'
    );

    // ------------------------------------------------------------------
    // TEST 11, 12, 13, 15: Regular COD, Regular Full Advance, Price Tampering, Expired Campaign Mid-Checkout
    // ------------------------------------------------------------------
    console.log('\n--- Tests 11, 12, 13, 15: COD, Full Advance, Anti-Tampering, Expiry During Checkout ---');
    // prodA is in poCampJson (Priority 100, collectionId matches, Rs. 1000 off -> Rs. 4000)
    // Client attempts to tamper price to Rs. 10! Server MUST charge Rs. 4000!
    const codRes = await createRegularOrderApi(
      makePublicReq('http://localhost/api/orders', 'POST', {
        fullName: 'Campaign Test Customer COD',
        phone: `0301${String(ts).slice(-7)}`,
        province: 'Punjab',
        city: 'Lahore',
        address: 'House 10, DHA Phase 5, Lahore',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: prodA.id, title: prodA.title, quantity: 2, price: 10 }],
      })
    );
    const codJson = await codRes.json();
    assert(codRes.status === 200 && Boolean(codJson.orderId), 'Regular COD campaign order placed');
    createdOrderIds.push(codJson.orderId);

    const codOrder = await prisma.order.findUnique({
      where: { id: codJson.orderId },
      include: { items: true },
    });
    assert(Boolean(codOrder), 'COD order retrieved from DB');
    if (codOrder?.customerId) createdCustomerIds.push(codOrder.customerId);
    const liveSettings = await getSiteSettings();
    const threshold = liveSettings.freeShippingThreshold ?? 10000;
    const flatFee = liveSettings.flatShippingFee ?? 250;
    const codChargeSetting = liveSettings.codCharge ?? 0;
    const expectedShipping8000 = 8000 >= threshold ? 0 : flatFee;
    const expectedCodTotal8000 = 8000 + expectedShipping8000 + codChargeSetting;

    assert(
      codOrder!.subtotal === 8000 &&
        codOrder!.campaignDiscountAmount === 2000 &&
        codOrder!.totalAmount === expectedCodTotal8000 &&
        codOrder!.items[0].originalPrice === 5000 &&
        codOrder!.items[0].unitPrice === 4000,
      `Server ignored manipulated client price (10) and stored authoritative campaign total (${expectedCodTotal8000}), got ${codOrder!.totalAmount}`
    );

    // Regular Full Advance Checkout with active campaign
    const faRes = await createRegularOrderApi(
      makePublicReq('http://localhost/api/orders', 'POST', {
        fullName: 'Campaign Test Customer FA',
        phone: `0302${String(ts).slice(-7)}`,
        province: 'Sindh',
        city: 'Karachi',
        address: 'Plot 22, Clifton, Karachi',
        paymentMethod: 'FULL_ADVANCE',
        selectedPaymentMethodId: paymentMethod!.id,
        screenshotKey: proofRes.filename,
        items: [{ productId: prodA.id, title: prodA.title, quantity: 3, price: 4000 }],
      })
    );
    const faJson = await faRes.json();
    assert(faRes.status === 200 && Boolean(faJson.orderId), 'Regular 100% Full Advance campaign order placed');
    createdOrderIds.push(faJson.orderId);

    const faOrder = await prisma.order.findUnique({ where: { id: faJson.orderId } });
    if (faOrder?.customerId) createdCustomerIds.push(faOrder.customerId);
    const expectedShipping12000 = 12000 >= threshold ? 0 : flatFee;
    const expectedFaTotal12000 = 12000 + expectedShipping12000;
    assert(
      faOrder!.status === 'PAYMENT_REVIEW_PENDING' &&
        faOrder!.totalAmount === expectedFaTotal12000 &&
        faOrder!.preOrderAdvancePercent === 100 &&
        faOrder!.preOrderAdvanceAmount === expectedFaTotal12000 &&
        faOrder!.campaignDiscountAmount === 3000,
      `Full Advance campaign order saved 100% advance (${expectedFaTotal12000}), PAYMENT_REVIEW_PENDING, Rs. 3000 campaign discount`
    );

    // Price-check endpoint consistency (mobile & desktop share exact same server quote)
    const expectedShipping4000 = 4000 >= threshold ? 0 : flatFee;
    const expectedPcTotal4000 = 4000 + expectedShipping4000 + codChargeSetting;
    const priceCheckRes = await priceCheckApi(
      makePublicReq('http://localhost/api/checkout/price-check', 'POST', {
        items: [{ productId: prodA.id, quantity: 1 }],
        city: 'Lahore',
        paymentMethod: 'CASH_ON_DELIVERY',
      })
    );
    const pcJson = await priceCheckRes.json();
    assert(
      priceCheckRes.status === 200 && pcJson.quote.totalAmount === expectedPcTotal4000,
      `Checkout price-check API returns exact authoritative quote (${expectedPcTotal4000})`
    );

    // Expire active campaigns right now -> simulate customer clicking Place Order with stale expectedTotalAmount
    for (const cid of [schedJson.campaign.id, storewideJson.campaign.id, poCampJson.campaign.id]) {
      await patchAdminCampaign(
        makeAdminReq(`http://localhost/api/admin/campaigns/${cid}`, 'PATCH', {
          action: 'COMPLETE',
        }),
        { params: Promise.resolve({ id: cid }) }
      );
    }

    const expectedShipping5000 = 5000 >= threshold ? 0 : flatFee;
    const expectedTotalAfterExpiry = 5000 + expectedShipping5000 + codChargeSetting;
    const staleExpiryRes = await createRegularOrderApi(
      makePublicReq('http://localhost/api/orders', 'POST', {
        fullName: 'Stale Checkout Test',
        phone: `0303${String(ts).slice(-7)}`,
        province: 'Punjab',
        city: 'Lahore',
        address: 'Model Town, Lahore',
        paymentMethod: 'CASH_ON_DELIVERY',
        expectedTotalAmount: expectedPcTotal4000, // customer saw Rs. 4000 before campaign expired
        items: [{ productId: prodA.id, quantity: 1, price: 4000 }],
      })
    );
    const staleExpiryJson = await staleExpiryRes.json();
    assert(
      staleExpiryRes.status === 409 &&
        staleExpiryJson.code === 'PRICE_CHANGED' &&
        staleExpiryJson.quote?.totalAmount === expectedTotalAfterExpiry,
      `Expired campaign mid-checkout safely aborts with 409 PRICE_CHANGED and sends refreshed Rs. ${expectedTotalAfterExpiry} quote`
    );

    // Verify historical order prices remained Rs. 4000/unit after campaign ended!
    const historicalCheck = await prisma.order.findUnique({
      where: { id: codOrder!.id },
      include: { items: true },
    });
    assert(
      historicalCheck!.totalAmount === expectedCodTotal8000 && historicalCheck!.items[0].unitPrice === 4000,
      'Historical order pricing preserved intact after all campaigns ended'
    );

    // Test pre-order checkout preserves pre-order rules (and respects global preorder_enabled toggle)
    const livePoSettings = await getPreOrderSettings();
    const poRes = await createPreOrderApi(
      makePublicReq('http://localhost/api/preorder/checkout', 'POST', {
        fullName: 'PreOrder Customer Test',
        phone: `0304${String(ts).slice(-7)}`,
        province: 'Punjab',
        city: 'Lahore',
        address: 'Gulberg III, Lahore',
        selectedPaymentMethodId: paymentMethod!.id,
        screenshotKey: proofRes.filename,
        items: [{ productId: prodPreOrder.id, title: prodPreOrder.title, quantity: 1 }],
      })
    );
    const poOrderJson = await poRes.json();
    if (!livePoSettings.preorder_enabled) {
      assert(poRes.status === 400, 'Pre-order endpoint respects disabled global preorder_enabled setting without error');
      const poQuoteCheck = await calculateServerCartQuote({
        items: [{ productId: prodPreOrder.id, quantity: 1 }],
        isPreOrderOrder: true,
        city: 'Lahore',
        paymentMethod: 'PRE_ORDER_ADVANCE',
      });
      const expectedPoSplit = calculatePreOrderAmounts(poQuoteCheck.totalAmount, 50);
      assert(
        expectedPoSplit.advanceAmount === Math.round((poQuoteCheck.totalAmount * 50) / 100),
        `Pre-order 50% advance calculation intact (${expectedPoSplit.advanceAmount}/${poQuoteCheck.totalAmount})`
      );
    } else {
      assert(poRes.status === 200 && Boolean(poOrderJson.orderId), 'Pre-order checkout succeeds normally');
      createdOrderIds.push(poOrderJson.orderId);
      const poOrder = await prisma.order.findUnique({ where: { id: poOrderJson.orderId } });
      if (poOrder?.customerId) createdCustomerIds.push(poOrder.customerId);
      const expectedShipping6000 = 6000 >= threshold ? 0 : flatFee;
      const expectedPoAdvance = Math.round(((6000 + expectedShipping6000) * 50) / 100);
      assert(
        poOrder!.isPreOrder && poOrder!.preOrderAdvancePercent === 50 && poOrder!.preOrderAdvanceAmount === expectedPoAdvance,
        `Pre-order 50% advance calculation remains untouched (${expectedPoAdvance})`
      );
    }

    // ------------------------------------------------------------------
    // TEST 18: Campaign Analytics Accuracy
    // ------------------------------------------------------------------
    console.log('\n--- Test 18: Campaign Analytics Accuracy ---');
    const expectedChargedTotal = expectedCodTotal8000 + expectedFaTotal12000;
    const expectedAov = Math.round(expectedChargedTotal / 2);
    const analytics = await getCampaignAnalytics(poCampJson.campaign.id);
    assert(
      analytics.campaignOrdersCount === 2,
      `Analytics counts 2 valid campaign orders (got ${analytics.campaignOrdersCount})`
    );
    assert(
      analytics.grossMerchandiseValue === 25000,
      `Analytics GMV equals 5 * 5000 = 25000 (got ${analytics.grossMerchandiseValue})`
    );
    assert(
      analytics.campaignDiscountsGranted === 5000,
      `Analytics discounts granted equals 2000 + 3000 = 5000 (got ${analytics.campaignDiscountsGranted})`
    );
    assert(
      analytics.netMerchandiseRevenue === 20000,
      `Analytics net merchandise revenue equals 20000 (got ${analytics.netMerchandiseRevenue})`
    );
    assert(
      analytics.totalChargedRevenue === expectedChargedTotal && analytics.averageOrderValue === expectedAov,
      `Analytics charged revenue (${expectedChargedTotal}) and AOV (${expectedAov}) accurate`
    );
    assert(
      analytics.salesByProduct.length === 1 && analytics.salesByProduct[0].unitsSold === 5,
      'Sales by product aggregates 5 units sold cleanly'
    );
    assert(
      analytics.revenueNote.includes('Profit'),
      'Analytics report explicitly distinguishes revenue from cost/profit'
    );

    const adminAnalyticsApiRes = await getAdminCampaignDetail(
      makeAdminReq(`http://localhost/api/admin/campaigns/${poCampJson.campaign.id}`, 'GET'),
      { params: Promise.resolve({ id: poCampJson.campaign.id }) }
    );
    assert(adminAnalyticsApiRes.status === 200, 'Admin campaign detail & analytics API returns 200');

    // Clean delete test via Admin DELETE endpoint
    const delDraftRes = await deleteAdminCampaign(
      makeAdminReq(`http://localhost/api/admin/campaigns/${dupJson.campaign.id}`, 'DELETE'),
      { params: Promise.resolve({ id: dupJson.campaign.id }) }
    );
    assert(delDraftRes.status === 200, 'Admin DELETE /api/admin/campaigns/[id] removes duplicate draft cleanly');

    console.log('\n==================================================================');
    console.log(`ALL SEASONAL CAMPAIGN TESTS COMPLETED: ${passed}/${total} PASSED (100%)`);
    console.log('==================================================================');
  } finally {
    console.log('\nCleaning up all test fixtures...');
    for (const oid of createdOrderIds) {
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }
    for (const cid of createdCustomerIds) {
      await prisma.customer.delete({ where: { id: cid } }).catch(() => {});
    }
    for (const campId of createdCampaignIds) {
      await prisma.campaign.delete({ where: { id: campId } }).catch(() => {});
    }
    for (const pid of createdProductIds) {
      await prisma.product.delete({ where: { id: pid } }).catch(() => {});
    }
    for (const catId of createdCategoryIds) {
      await prisma.category.delete({ where: { id: catId } }).catch(() => {});
    }
    for (const colId of createdCollectionIds) {
      await prisma.collection.delete({ where: { id: colId } }).catch(() => {});
    }
    for (const code of createdCouponCodes) {
      await prisma.coupon.delete({ where: { code } }).catch(() => {});
    }
    if (createdMethodId) {
      await prisma.preOrderPaymentMethod.delete({ where: { id: createdMethodId } }).catch(() => {});
    }
    for (const pk of createdProofKeys) {
      await deleteFile(pk).catch(() => {});
    }
    console.log('Cleanup complete.');
  }
}

runSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

